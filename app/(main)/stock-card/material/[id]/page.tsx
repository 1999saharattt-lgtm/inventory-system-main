import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import ExportPdf from "./ExportPdf";
import ExportExcel from "./ExportExcel";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";
import AppTableCard from "@/components/AppTableCard";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type Lot = {
  id: number;
  qty: number;
  manufacture: Date | null;
  expiry: Date | null;
};

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

/* =========================================================
   THAI SHORT DATE
   ตัวอย่าง:
   01 ม.ค. 69
   02 ก.พ. 69
   23 ก.ย. 69
========================================================= */

const thaiShortMonths = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function formatThaiShortDate(
  date: Date | string | null
) {
  if (!date) {
    return "-";
  }

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  const day = String(
    d.getDate()
  ).padStart(2, "0");

  const month =
    thaiShortMonths[d.getMonth()];

  const buddhistYear =
    d.getFullYear() + 543;

  const shortYear = String(
    buddhistYear
  ).slice(-2);

  return `${day} ${month} ${shortYear}`;
}

/* =========================================================
   MONEY
========================================================= */

function formatMoney(
  value: number | string
) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return "0.00";
  }

  return numberValue.toLocaleString(
    "th-TH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

/* =========================================================
   NUMBER
========================================================= */

function formatNumber(
  value: number | string
) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return "0";
  }

  return numberValue.toLocaleString(
    "th-TH"
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function StockCardPage({
  params,
}: Props) {
  const { id } = await params;

  /* =======================================================
     VALIDATE ID
  ======================================================= */

  const materialId = Number(id);

  if (
    !Number.isInteger(materialId) ||
    materialId <= 0
  ) {
    notFound();
  }

  /* =======================================================
     MATERIAL
  ======================================================= */

  const material =
    await prisma.material.findUnique({
      where: {
        id: materialId,
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
    notFound();
  }

  /* =======================================================
     LATEST RECEIVE
  ======================================================= */

  const latestReceiveItem =
    material.receiveItems.length > 0
      ? material.receiveItems[
          material.receiveItems.length - 1
        ]
      : null;

  const latestVendor =
    latestReceiveItem?.receive.vendor
      ?.name ?? "-";

  const latestPrice = latestReceiveItem
    ? Number(latestReceiveItem.unitPrice)
    : 0;

  /* =======================================================
     FEFO LOTS
  ======================================================= */

  const lots: Lot[] = [];

  /* =======================================================
     EVENTS
     เฉพาะ APPROVED เท่านั้นที่ตัดสต็อก
  ======================================================= */

  const events = [
    ...material.receiveItems.map(
      (item) => ({
        type: "receive" as const,
        date: item.receive.receiveDate,
        item,
      })
    ),

    ...material.issueItems
      .filter(
        (item) =>
          item.issue.status ===
          "APPROVED"
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

  /* =======================================================
     ISSUE LOT MAP
  ======================================================= */

  const issueLotMap = new Map<
    number,
    {
      manufacture: Date | null;
      expiry: Date | null;
    }
  >();

  /* =======================================================
     FEFO PROCESS
  ======================================================= */

  for (const event of events) {
    if (event.type === "receive") {
      const receiveItem = event.item;

      lots.push({
        id: receiveItem.id,
        qty: Number(receiveItem.qty),
        manufacture:
          receiveItem.manufacture,
        expiry: receiveItem.expiry,
      });

      continue;
    }

    const issueItem = event.item;

    let remainingQty = Number(
      issueItem.issuedQty ??
        issueItem.qty
    );

    const availableLots = lots
      .filter((lot) => lot.qty > 0)
      .sort((a, b) => {
        const aUnspecified =
          !a.manufacture &&
          !a.expiry;

        const bUnspecified =
          !b.manufacture &&
          !b.expiry;

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
          ? new Date(
              a.expiry
            ).getTime()
          : Number.MAX_SAFE_INTEGER;

        const bExpiry = b.expiry
          ? new Date(
              b.expiry
            ).getTime()
          : Number.MAX_SAFE_INTEGER;

        if (aExpiry !== bExpiry) {
          return aExpiry - bExpiry;
        }

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

        return a.id - b.id;
      });

    let selectedLot: Lot | null =
      null;

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

  /* =======================================================
     STOCK CARD ROWS
  ======================================================= */

  const rows = [
    ...material.receiveItems.map(
      (item) => ({
        date: item.receive.receiveDate,

        documentNo:
          item.receive.documentNo,

        owner:
          item.receive.vendor?.name ??
          "-",

        unitPrice: Number(
          item.unitPrice
        ),

        receiveQty: Number(
          item.qty
        ),

        issueQty: 0,

        manufacture:
          item.manufacture,

        expiry: item.expiry,
      })
    ),

    ...material.issueItems
      .filter(
        (item) =>
          item.issue.status ===
          "APPROVED"
      )
      .map((item) => {
        const lot =
          issueLotMap.get(item.id);

        return {
          date: item.issue.issueDate,

          documentNo:
            item.issue.documentNo,

          owner:
            item.issue.department
              ?.name ?? "-",

          unitPrice: latestPrice,

          receiveQty: 0,

          issueQty: Number(
            item.issuedQty ??
              item.qty
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

  /* =======================================================
     BALANCE
  ======================================================= */

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

  /* =======================================================
     EXPORT MATERIAL
  ======================================================= */

  const exportMaterial = {
    ...material,

    vendor:
      latestReceiveItem?.receive
        .vendor ?? null,

    latestPrice,
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📒"
        title="บัญชีพัสดุ"
        subtitle={material.name}
        actions={
          <AppButton
            href={`/stock-card/${material.category}`}
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

      {/* =====================================================
          MATERIAL INFORMATION
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
          p-4
          sm:p-5
          lg:p-6
        "
      >
        {/* ===================================================
            SECTION HEADER + EXPORT BUTTONS
        =================================================== */}

        <div
          className="
            mb-5
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-[15px]
                bg-slate-100
                text-xl
                shadow-sm
              "
              aria-hidden="true"
            >
              📦
            </div>

            <div className="min-w-0">
              <h2
                className="
                  text-lg
                  font-black
                  tracking-tight
                  !text-slate-900
                  sm:text-xl
                "
              >
                ข้อมูลพัสดุ
              </h2>

              <p
                className="
                  mt-0.5
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                รายละเอียดข้อมูลพัสดุและข้อมูลล่าสุด
              </p>
            </div>
          </div>

          <div
            className="
              flex
              w-full
              flex-col
              gap-2
              sm:w-auto
              sm:flex-row
              sm:items-center
              sm:justify-end
            "
          >
            <ExportPdf
              material={exportMaterial}
              rows={stockRows}
            />

            <ExportExcel
              material={exportMaterial}
              rows={stockRows}
            />
          </div>
        </div>

        {/* ===================================================
            INFO GRID
        =================================================== */}

        <div
          className="
            grid
            w-full
            min-w-0
            grid-cols-1
            gap-4
            md:grid-cols-2
            xl:grid-cols-3
          "
        >
          <AppInfoCard>
            <p
              className="
                text-sm
                font-extrabold
                !text-slate-500
              "
            >
              รหัสพัสดุ
            </p>

            <p
              className="
                mt-2
                break-words
                text-base
                font-black
                !text-slate-900
                sm:text-lg
              "
            >
              {material.code || "-"}
            </p>
          </AppInfoCard>

          <AppInfoCard>
            <p
              className="
                text-sm
                font-extrabold
                !text-slate-500
              "
            >
              รายการพัสดุ
            </p>

            <p
              className="
                mt-2
                break-words
                text-base
                font-black
                !text-slate-900
                sm:text-lg
              "
            >
              {material.name || "-"}
            </p>
          </AppInfoCard>

          <AppInfoCard>
            <p
              className="
                text-sm
                font-extrabold
                !text-slate-500
              "
            >
              หมวดหมู่
            </p>

            <p
              className="
                mt-2
                break-words
                text-base
                font-black
                !text-slate-900
                sm:text-lg
              "
            >
              {categoryName[
                material.category
              ] ??
                material.category ??
                "-"}
            </p>
          </AppInfoCard>

          <AppInfoCard>
            <p
              className="
                text-sm
                font-extrabold
                !text-slate-500
              "
            >
              หน่วย
            </p>

            <p
              className="
                mt-2
                text-base
                font-black
                !text-slate-900
                sm:text-lg
              "
            >
              {material.unit || "-"}
            </p>
          </AppInfoCard>

          <AppInfoCard>
            <p
              className="
                text-sm
                font-extrabold
                !text-slate-500
              "
            >
              ผู้จำหน่ายล่าสุด
            </p>

            <p
              className="
                mt-2
                break-words
                text-base
                font-black
                !text-slate-900
                sm:text-lg
              "
            >
              {latestVendor}
            </p>
          </AppInfoCard>

          <AppInfoCard>
            <p
              className="
                text-sm
                font-extrabold
                !text-slate-500
              "
            >
              ราคาล่าสุด
            </p>

            <p
              className="
                mt-2
                text-base
                font-black
                tabular-nums
                !text-slate-900
                sm:text-lg
              "
            >
              {latestReceiveItem
                ? `${formatMoney(
                    latestPrice
                  )} บาท`
                : "-"}
            </p>
          </AppInfoCard>
        </div>
      </AppCard>

      {/* =====================================================
          STOCK TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการเคลื่อนไหวบัญชีพัสดุ"
        subtitle={`ประวัติการรับเข้าและเบิกจ่าย • ทั้งหมด ${stockRows.length.toLocaleString(
          "th-TH"
        )} รายการ`}
      >
        <div
          className="
            w-full
            min-w-0
            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            className="
              w-full
              min-w-[1300px]
              border-collapse
              bg-white
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
                ].map(
                  (tableTitle) => (
                    <th
                      key={tableTitle}
                      className="
                        whitespace-nowrap
                        border
                        border-black
                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700
                        px-4
                        py-4
                        text-center
                        text-base
                        font-extrabold
                        !text-white
                        sm:text-lg
                      "
                    >
                      {tableTitle}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {stockRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="
                      border
                      border-black
                      bg-white
                      px-6
                      py-16
                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto
                        flex
                        max-w-md
                        flex-col
                        items-center
                      "
                    >
                      <div
                        className="
                          flex
                          h-16
                          w-16
                          items-center
                          justify-center
                          rounded-[20px]
                          bg-slate-100
                          text-3xl
                          shadow-inner
                        "
                        aria-hidden="true"
                      >
                        📒
                      </div>

                      <p
                        className="
                          mt-4
                          text-lg
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        ยังไม่มีข้อมูล
                      </p>

                      <p
                        className="
                          mt-1
                          text-sm
                          font-semibold
                          !text-slate-500
                        "
                      >
                        เมื่อมีรายการรับเข้าหรือเบิกจ่าย
                        ข้อมูลจะแสดงในส่วนนี้
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                stockRows.map(
                  (row, index) => (
                    <tr
                      key={`${row.documentNo}-${index}`}
                      className={`
                        transition-colors
                        duration-200

                        ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* =====================================
                          DATE
                          เช่น 01 ม.ค. 69
                      ===================================== */}

                      <td
                        className="
                          min-w-[130px]
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                          font-bold
                          !text-slate-700
                        "
                      >
                        {formatThaiShortDate(
                          row.date
                        )}
                      </td>

                      {/* =====================================
                          DOCUMENT NO
                          จัดกึ่งกลาง
                      ===================================== */}

                      <td
                        className="
                          min-w-[180px]
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                          font-bold
                          !text-slate-900
                        "
                      >
                        {row.documentNo ||
                          "-"}
                      </td>

                      {/* =====================================
                          OWNER
                      ===================================== */}

                      <td
                        className="
                          min-w-[280px]
                          border
                          border-black
                          px-4
                          py-3.5
                          font-bold
                          !text-slate-900
                        "
                      >
                        {row.owner || "-"}
                      </td>

                      {/* =====================================
                          PRICE
                      ===================================== */}

                      <td
                        className="
                          min-w-[150px]
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3.5
                          text-right
                          font-extrabold
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {formatMoney(
                          row.unitPrice
                        )}
                      </td>

                      {/* =====================================
                          RECEIVE
                      ===================================== */}

                      <td
                        className="
                          min-w-[110px]
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                          font-extrabold
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {row.receiveQty > 0
                          ? formatNumber(
                              row.receiveQty
                            )
                          : "-"}
                      </td>

                      {/* =====================================
                          ISSUE
                      ===================================== */}

                      <td
                        className="
                          min-w-[110px]
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                          font-extrabold
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {row.issueQty > 0
                          ? formatNumber(
                              row.issueQty
                            )
                          : "-"}
                      </td>

                      {/* =====================================
                          BALANCE
                      ===================================== */}

                      <td
                        className="
                          min-w-[110px]
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                          font-black
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {formatNumber(
                          row.balance
                        )}
                      </td>

                      {/* =====================================
                          MANUFACTURE
                          เช่น 01 ม.ค. 69
                      ===================================== */}

                      <td
                        className="
                          min-w-[130px]
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                          font-bold
                          !text-slate-700
                        "
                      >
                        {formatThaiShortDate(
                          row.manufacture
                        )}
                      </td>

                      {/* =====================================
                          EXPIRY
                          เช่น 01 ม.ค. 69
                      ===================================== */}

                      <td
                        className="
                          min-w-[130px]
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                          font-bold
                          !text-slate-700
                        "
                      >
                        {formatThaiShortDate(
                          row.expiry
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </AppPage>
  );
}