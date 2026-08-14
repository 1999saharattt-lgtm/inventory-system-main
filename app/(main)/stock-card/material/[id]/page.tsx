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
    return <div>ไม่พบข้อมูลพัสดุ</div>;
  }

  // ==========================================
  // รายการรับเข้าล่าสุด
  // ใช้ข้อมูลนี้เป็นผู้จำหน่ายและราคาล่าสุด
  // ==========================================

  const latestReceiveItem =
    material.receiveItems.length > 0
      ? material.receiveItems[material.receiveItems.length - 1]
      : null;

  const latestVendor =
    latestReceiveItem?.receive.vendor?.name ?? "-";

  const latestPrice =
    latestReceiveItem
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
  // แล้วเรียงตามวันที่
  // ==========================================

  const events = [
    ...material.receiveItems.map((item) => ({
      type: "receive" as const,
      date: item.receive.receiveDate,
      item,
    })),

    ...material.issueItems.map((item) => ({
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

    // ถ้าวันเดียวกัน
    // ให้รับเข้าก่อนเบิก
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
  // จำลองการเคลื่อนไหวของสต็อก
  // ตามลำดับเวลาจริง
  // ==========================================

  for (const event of events) {
    // ========================================
    // ถ้าเป็นรายการรับเข้า
    // ให้สร้างล็อตใหม่
    // ========================================

    if (event.type === "receive") {
      const receiveItem = event.item;

      lots.push({
        id: receiveItem.id,

        qty: Number(receiveItem.qty),

        manufacture:
          receiveItem.manufacture,

        expiry:
          receiveItem.expiry,
      });

      continue;
    }

    // ========================================
    // ถ้าเป็นรายการเบิก
    // ========================================

    const issueItem = event.item;

    let remainingQty =
      Number(issueItem.qty);

    // ========================================
    // เรียงล็อตสำหรับตัด FEFO
    //
    // ลำดับที่ต้องการ:
    //
    // 1. ล็อตที่ไม่มีวันผลิตและไม่มีวันหมดอายุ
    //    ให้ตัดก่อน
    //
    // 2. ล็อตที่ระบุวัน
    //    ให้ใช้วันหมดอายุเร็วที่สุด
    //
    // 3. ถ้าวันหมดอายุเท่ากัน
    //    ใช้วันผลิตเก่าก่อน
    //
    // 4. ถ้าเหมือนกัน
    //    ใช้ล็อตที่รับเข้าก่อน
    // ========================================

    const availableLots = lots
      .filter(
        (lot) =>
          lot.qty > 0
      )
      .sort((a, b) => {
        // ------------------------------------
        // ตรวจสอบว่าล็อตไหน "ไม่ระบุวัน"
        // ------------------------------------

        const aUnspecified =
          !a.manufacture &&
          !a.expiry;

        const bUnspecified =
          !b.manufacture &&
          !b.expiry;

        // ล็อตไม่ระบุวันมาก่อนเสมอ
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

        // ------------------------------------
        // ถ้าทั้งคู่เป็นล็อตไม่ระบุวัน
        // ใช้ล็อตที่รับเข้าก่อน
        // ------------------------------------

        if (
          aUnspecified &&
          bUnspecified
        ) {
          return a.id - b.id;
        }

        // ------------------------------------
        // จากตรงนี้คือทั้งคู่เป็นล็อตที่มีวัน
        // ------------------------------------

        const aExpiry =
          a.expiry
            ? new Date(
                a.expiry
              ).getTime()
            : Number.MAX_SAFE_INTEGER;

        const bExpiry =
          b.expiry
            ? new Date(
                b.expiry
              ).getTime()
            : Number.MAX_SAFE_INTEGER;

        // วันหมดอายุเร็วกว่า ใช้ก่อน
        if (
          aExpiry !== bExpiry
        ) {
          return (
            aExpiry -
            bExpiry
          );
        }

        // ------------------------------------
        // ถ้าวันหมดอายุเท่ากัน
        // ใช้วันผลิตเก่าก่อน
        // ------------------------------------

        const aManufacture =
          a.manufacture
            ? new Date(
                a.manufacture
              ).getTime()
            : Number.MAX_SAFE_INTEGER;

        const bManufacture =
          b.manufacture
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

        // ------------------------------------
        // ถ้าเหมือนกันทั้งหมด
        // ใช้ล็อตที่รับเข้าก่อน
        // ------------------------------------

        return a.id - b.id;
      });

    // ========================================
    // เก็บล็อตแรกที่ถูกใช้
    // ========================================

    let selectedLot: Lot | null =
      null;

    // ========================================
    // ตัดจำนวนจากล็อต
    // ========================================

    for (
      const lot of availableLots
    ) {
      if (
        remainingQty <= 0
      ) {
        break;
      }

      const issueQty =
        Math.min(
          remainingQty,
          lot.qty
        );

      // จำล็อตแรกที่รายการเบิกนี้ใช้
      if (
        !selectedLot
      ) {
        selectedLot = lot;
      }

      // หักจำนวนออกจากล็อต
      lot.qty -= issueQty;

      // จำนวนที่ยังต้องเบิก
      remainingQty -= issueQty;
    }

    // ========================================
    // บันทึกล็อตที่รายการเบิกนี้ใช้
    // ========================================

    if (
      selectedLot
    ) {
      issueLotMap.set(
        issueItem.id,
        {
          manufacture:
            selectedLot.manufacture,

          expiry:
            selectedLot.expiry,
        }
      );
    }
  }

  // ==========================================
  // สร้างข้อมูล Stock Card
  // ==========================================

  const rows = [
    ...material.receiveItems.map((item) => ({
      date: item.receive.receiveDate,

      documentNo: item.receive.documentNo,

      owner:
        item.receive.vendor?.name ?? "-",

      unitPrice: Number(item.unitPrice),

      receiveQty: item.qty,

      issueQty: 0,

      manufacture: item.manufacture,

      expiry: item.expiry,
    })),

    ...material.issueItems.map((item) => {
      // ค้นหาล็อตที่รายการเบิกนี้ถูกตัด
      const lot =
        issueLotMap.get(item.id);

      return {
        date: item.issue.issueDate,

        documentNo: item.issue.documentNo,

        owner:
          item.issue.department?.name ?? "-",

        // ใช้ราคาจากรายการรับเข้าล่าสุด
        unitPrice: latestPrice,

        receiveQty: 0,

        issueQty: item.qty,

        // ใช้วันผลิตจากล็อตที่ถูกตัด
        manufacture:
          lot?.manufacture ?? null,

        // ใช้วันหมดอายุจากล็อตที่ถูกตัด
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
    balance += row.receiveQty;

    balance -= row.issueQty;

    return {
      ...row,
      balance,
    };
  });

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">

      {/* Header */}

      <div
        className="
          flex
          flex-col
          gap-4
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-4
          text-white
          shadow-xl
          sm:p-6
          md:flex-row
          md:items-center
          md:justify-between
        "
      >
        <div className="min-w-0">
          <h1
            className="
              text-3xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-4xl
              md:text-5xl
            "
          >
            📒 บัญชีพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-base
              font-semibold
              text-slate-200
              sm:mt-3
              sm:text-xl
            "
          >
            {material.name}
          </p>
        </div>

        <Link
          href={`/stock-card/${material.category}`}
          className="
            w-fit
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-3
            text-base
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
            sm:text-lg
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* รายละเอียดพัสดุ */}

      <div
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-4
          shadow-xl
          sm:p-6
        "
      >
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">

          <div>
            <p
              className="
                text-base
                font-bold
                text-slate-500
                sm:text-lg
              "
            >
              รหัสพัสดุ
            </p>

            <p
              className="
                mt-1
                break-words
                text-lg
                font-extrabold
                text-slate-900
                sm:text-xl
              "
            >
              {material.code || "-"}
            </p>
          </div>

          <div>
            <p
              className="
                text-base
                font-bold
                text-slate-500
                sm:text-lg
              "
            >
              รายการพัสดุ
            </p>

            <p
              className="
                mt-1
                break-words
                text-lg
                font-extrabold
                text-slate-900
                sm:text-xl
              "
            >
              {material.name || "-"}
            </p>
          </div>

          <div>
            <p
              className="
                text-base
                font-bold
                text-slate-500
                sm:text-lg
              "
            >
              หมวดหมู่
            </p>

            <p
              className="
                mt-1
                break-words
                text-lg
                font-extrabold
                text-slate-900
                sm:text-xl
              "
            >
              {categoryName[material.category] ??
                material.category ??
                "-"}
            </p>
          </div>

          <div>
            <p
              className="
                text-base
                font-bold
                text-slate-500
                sm:text-lg
              "
            >
              หน่วย
            </p>

            <p
              className="
                mt-1
                text-lg
                font-extrabold
                text-slate-900
                sm:text-xl
              "
            >
              {material.unit || "-"}
            </p>
          </div>

          <div>
            <p
              className="
                text-base
                font-bold
                text-slate-500
                sm:text-lg
              "
            >
              ผู้จำหน่ายล่าสุด
            </p>

            <p
              className="
                mt-1
                break-words
                text-lg
                font-extrabold
                text-slate-900
                sm:text-xl
              "
            >
              {latestVendor}
            </p>
          </div>

          <div>
            <p
              className="
                text-base
                font-bold
                text-slate-500
                sm:text-lg
              "
            >
              ราคาล่าสุด
            </p>

            <p
              className="
                mt-1
                text-lg
                font-extrabold
                text-slate-900
                sm:text-xl
              "
            >
              {latestReceiveItem
                ? latestPrice.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "-"}{" "}
              บาท
            </p>
          </div>

        </div>
      </div>

      {/* ตารางบัญชีพัสดุ */}

      <div
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-xl
        "
      >
        <div
          className="
            w-full
            overflow-x-auto
          "
        >
          <table
            className="
              w-max
              min-w-[1100px]
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
                      px-3
                      py-3
                      text-center
                      text-sm
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
                      py-12
                      text-center
                      text-base
                      font-bold
                      text-slate-500
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
                      border
                      border-slate-900
                      hover:bg-blue-50
                    "
                  >
                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-slate-900
                        px-3
                        py-3
                        text-center
                        text-sm
                        font-semibold
                        text-slate-700
                        sm:px-4
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
                        px-3
                        py-3
                        text-sm
                        font-semibold
                        text-slate-700
                        sm:px-4
                        sm:text-base
                      "
                    >
                      {row.documentNo}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                        text-sm
                        font-semibold
                        text-slate-700
                        sm:px-4
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
                        px-3
                        py-3
                        text-right
                        text-sm
                        font-semibold
                        text-slate-700
                        sm:px-4
                        sm:text-base
                      "
                    >
                      {Number(row.unitPrice).toLocaleString(
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
                        px-3
                        py-3
                        text-center
                        text-sm
                        font-extrabold
                        text-slate-900
                        sm:px-4
                        sm:text-base
                      "
                    >
                      {row.receiveQty || "-"}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                        text-center
                        text-sm
                        font-extrabold
                        text-slate-900
                        sm:px-4
                        sm:text-base
                      "
                    >
                      {row.issueQty || "-"}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                        text-center
                        text-sm
                        font-extrabold
                        text-slate-900
                        sm:px-4
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
                        px-3
                        py-3
                        text-center
                        text-sm
                        font-semibold
                        text-slate-700
                        sm:px-4
                        sm:text-base
                      "
                    >
                      {row.manufacture
                        ? formatDateAD(row.manufacture)
                        : "-"}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-slate-900
                        px-3
                        py-3
                        text-center
                        text-sm
                        font-semibold
                        text-slate-700
                        sm:px-4
                        sm:text-base
                      "
                    >
                      {row.expiry
                        ? formatDateAD(row.expiry)
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export */}

      <div className="flex flex-wrap gap-3">
        <ExportPdf
          material={{
            ...material,
            vendor:
              latestReceiveItem?.receive.vendor ?? null,
            latestPrice,
          }}
          rows={stockRows}
        />

        <ExportExcel
          material={{
            ...material,
            vendor:
              latestReceiveItem?.receive.vendor ?? null,
            latestPrice,
          }}
          rows={stockRows}
        />
      </div>
    </div>
  );
}