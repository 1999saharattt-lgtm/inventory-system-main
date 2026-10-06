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
   FORCE FRESH DATA
========================================================= */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    fiscalYear?: string;
  }>;
};

type FiscalYearRange = {
  fiscalYearThai: number;
  fiscalYearGregorian: number;
  startDate: Date;
  endDate: Date;
};

type ThailandDateParts = {
  year: number;
  month: number;
  day: number;
};

type Lot = {
  id: number;
  qty: number;
  manufacture: Date | null;
  expiry: Date | null;
};

type MovementRow = {
  date: Date;
  sortId: number;

  documentNo: string;
  owner: string;

  unitPrice: number;

  receiveQty: number;
  issueQty: number;

  manufacture: Date | null;
  expiry: Date | null;

  type: "RECEIVE" | "ISSUE";
};

type StockRow = {
  date: Date;

  documentNo: string;
  owner: string;

  unitPrice: number;

  receiveQty: number;
  issueQty: number;
  balance: number;

  manufacture: Date | null;
  expiry: Date | null;

  type:
    | "OPENING_BALANCE"
    | "RECEIVE"
    | "ISSUE";
};

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
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

/* =========================================================
   THAI MONTHS
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

/* =========================================================
   THAILAND DATE PARTS
========================================================= */

function getThailandDateParts(
  value: Date
): ThailandDateParts {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Bangkok",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    );

  const parts =
    formatter.formatToParts(
      value
    );

  const year =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "year"
      )?.value
    );

  const month =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "month"
      )?.value
    );

  const day =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "day"
      )?.value
    );

  return {
    year,
    month,
    day,
  };
}

/* =========================================================
   CURRENT FISCAL YEAR
========================================================= */

function getCurrentFiscalYearThai(
  value: Date =
    new Date()
) {
  const parts =
    getThailandDateParts(
      value
    );

  const fiscalYearGregorian =
    parts.month >= 10
      ? parts.year + 1
      : parts.year;

  return (
    fiscalYearGregorian +
    543
  );
}

/* =========================================================
   FISCAL YEAR RANGE

   FY 2570
   1 ต.ค. 2569
   ถึงก่อน
   1 ต.ค. 2570
========================================================= */

function getFiscalYearRange(
  fiscalYearThai: number
): FiscalYearRange {
  const fiscalYearGregorian =
    fiscalYearThai -
    543;

  const startDate =
    new Date(
      Date.UTC(
        fiscalYearGregorian -
          1,
        9,
        1,
        0,
        0,
        0,
        0
      )
    );

  const endDate =
    new Date(
      Date.UTC(
        fiscalYearGregorian,
        9,
        1,
        0,
        0,
        0,
        0
      )
    );

  return {
    fiscalYearThai,
    fiscalYearGregorian,
    startDate,
    endDate,
  };
}

/* =========================================================
   DISPLAY END DATE
========================================================= */

function getDisplayEndDate(
  range: FiscalYearRange
) {
  return new Date(
    range.endDate.getTime() -
      24 * 60 * 60 * 1000
  );
}

/* =========================================================
   DATE RANGE
========================================================= */

function isBeforeDate(
  value: Date,
  target: Date
) {
  return (
    new Date(value).getTime() <
    target.getTime()
  );
}

function isDateInRange(
  value: Date,
  range: FiscalYearRange
) {
  const time =
    new Date(
      value
    ).getTime();

  return (
    time >=
      range.startDate.getTime() &&
    time <
      range.endDate.getTime()
  );
}

/* =========================================================
   THAI SHORT DATE
========================================================= */

function formatThaiShortDate(
  date:
    | Date
    | string
    | null
) {
  if (!date) {
    return "-";
  }

  const d =
    new Date(
      date
    );

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {
    return "-";
  }

  const parts =
    getThailandDateParts(
      d
    );

  const day =
    String(
      parts.day
    ).padStart(
      2,
      "0"
    );

  const month =
    thaiShortMonths[
      parts.month -
        1
    ];

  const buddhistYear =
    parts.year +
    543;

  const shortYear =
    String(
      buddhistYear
    ).slice(
      -2
    );

  return `${day} ${month} ${shortYear}`;
}

/* =========================================================
   THAI FULL DATE
========================================================= */

function formatThaiFullDate(
  value: Date
) {
  const parts =
    getThailandDateParts(
      value
    );

  const month =
    thaiShortMonths[
      parts.month -
        1
    ];

  return `${parts.day} ${month} ${
    parts.year + 543
  }`;
}

/* =========================================================
   MONEY
========================================================= */

function formatMoney(
  value:
    number | string
) {
  const numberValue =
    Number(
      value
    );

  if (
    Number.isNaN(
      numberValue
    )
  ) {
    return "0.00";
  }

  return numberValue.toLocaleString(
    "th-TH",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  );
}

/* =========================================================
   NUMBER
========================================================= */

function formatNumber(
  value:
    number | string
) {
  const numberValue =
    Number(
      value
    );

  if (
    Number.isNaN(
      numberValue
    )
  ) {
    return "0";
  }

  return numberValue.toLocaleString(
    "th-TH"
  );
}

/* =========================================================
   ACTUAL ISSUE QTY

   ใช้ค่าที่จ่ายจริง

   ถ้า issuedQty เป็น null/undefined
   จึง fallback ไป qty

   หมายเหตุ:
   issuedQty = 0 ถือว่าเป็น 0 จริง
========================================================= */

function getActualIssuedQty(
  item: {
    qty: number;
    issuedQty:
      number | null;
  }
) {
  if (
    item.issuedQty !==
      null &&
    item.issuedQty !==
      undefined
  ) {
    return Number(
      item.issuedQty
    );
  }

  return Number(
    item.qty ??
      0
  );
}

/* =========================================================
   FEFO SORT

   1. มีวันหมดอายุก่อน
   2. วันหมดอายุเร็วกว่า
   3. วันผลิตเก่ากว่า
   4. ไม่มีวันหมดอายุอยู่ท้าย
   5. id เก่าก่อน
========================================================= */

function sortLotsByFefo(
  lots: Lot[]
) {
  return [...lots].sort(
    (
      a,
      b
    ) => {
      const aHasExpiry =
        Boolean(
          a.expiry
        );

      const bHasExpiry =
        Boolean(
          b.expiry
        );

      if (
        aHasExpiry &&
        !bHasExpiry
      ) {
        return -1;
      }

      if (
        !aHasExpiry &&
        bHasExpiry
      ) {
        return 1;
      }

      if (
        a.expiry &&
        b.expiry
      ) {
        const diff =
          new Date(
            a.expiry
          ).getTime() -
          new Date(
            b.expiry
          ).getTime();

        if (
          diff !==
          0
        ) {
          return diff;
        }
      }

      const aHasManufacture =
        Boolean(
          a.manufacture
        );

      const bHasManufacture =
        Boolean(
          b.manufacture
        );

      if (
        aHasManufacture &&
        !bHasManufacture
      ) {
        return -1;
      }

      if (
        !aHasManufacture &&
        bHasManufacture
      ) {
        return 1;
      }

      if (
        a.manufacture &&
        b.manufacture
      ) {
        const diff =
          new Date(
            a.manufacture
          ).getTime() -
          new Date(
            b.manufacture
          ).getTime();

        if (
          diff !==
          0
        ) {
          return diff;
        }
      }

      return (
        a.id -
        b.id
      );
    }
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function StockCardPage({
  params,
  searchParams,
}: Props) {
  const {
    id,
  } =
    await params;

  const query =
    await searchParams;

  /* =======================================================
     VALIDATE ID
  ======================================================= */

  const materialId =
    Number(
      id
    );

  if (
    !Number.isInteger(
      materialId
    ) ||
    materialId <= 0
  ) {
    notFound();
  }

  /* =======================================================
     FISCAL YEAR
  ======================================================= */

  const currentFiscalYear =
    getCurrentFiscalYearThai();

  const requestedFiscalYear =
    Number(
      query.fiscalYear
    );

  const selectedFiscalYear =
    Number.isInteger(
      requestedFiscalYear
    ) &&
    requestedFiscalYear >=
      2400 &&
    requestedFiscalYear <=
      3000
      ? requestedFiscalYear
      : currentFiscalYear;

  const fiscalRange =
    getFiscalYearRange(
      selectedFiscalYear
    );

  const displayEndDate =
    getDisplayEndDate(
      fiscalRange
    );

  /* =======================================================
     MATERIAL

     สำคัญ:
     - READ ONLY
     - ไม่มี create/update Transaction
     - โหลด Receive/Approved Issue ตั้งแต่ต้น
       จนถึงสิ้น FY ที่เลือก
  ======================================================= */

  const material =
    await prisma.material.findUnique({
      where: {
        id:
          materialId,
      },

      include: {
        vendor:
          true,

        receiveItems: {
          where: {
            receive: {
              receiveDate: {
                lt:
                  fiscalRange.endDate,
              },
            },
          },

          include: {
            receive: {
              include: {
                vendor:
                  true,
              },
            },
          },

          orderBy: [
            {
              receive: {
                receiveDate:
                  "asc",
              },
            },

            {
              id:
                "asc",
            },
          ],
        },

        issueItems: {
          where: {
            issue: {
              issueDate: {
                lt:
                  fiscalRange.endDate,
              },

              status:
                "APPROVED",
            },
          },

          include: {
            issue: {
              include: {
                department:
                  true,
              },
            },
          },

          orderBy: [
            {
              issue: {
                issueDate:
                  "asc",
              },
            },

            {
              id:
                "asc",
            },
          ],
        },
      },
    });

  if (!material) {
    notFound();
  }

  /* =======================================================
     LATEST RECEIVE AS OF END OF SELECTED FY
  ======================================================= */

  const latestReceiveItem =
    material.receiveItems.length >
    0
      ? material.receiveItems[
          material.receiveItems.length -
            1
        ]
      : null;

  const latestVendor =
    latestReceiveItem
      ?.receive
      ?.vendor
      ?.name ??
    material.vendor
      ?.name ??
    "-";

  const latestPrice =
    latestReceiveItem
      ? Number(
          latestReceiveItem.unitPrice
        )
      : Number(
          material.latestPrice ??
            0
        );

  /* =======================================================
     BUILD ALL EVENTS

     เราไม่อ่าน Transaction.balance อีกแล้ว

     Stock Card คำนวณจาก:
     RECEIVE
     +
     APPROVED ISSUE
  ======================================================= */

  const allEvents = [
    ...material.receiveItems.map(
      (
        item
      ) => ({
        type:
          "RECEIVE" as const,

        date:
          item.receive
            .receiveDate,

        sortId:
          item.id,

        item,
      })
    ),

    ...material.issueItems.map(
      (
        item
      ) => ({
        type:
          "ISSUE" as const,

        date:
          item.issue
            .issueDate,

        sortId:
          item.id,

        item,
      })
    ),
  ].sort(
    (
      a,
      b
    ) => {
      const dateDiff =
        new Date(
          a.date
        ).getTime() -
        new Date(
          b.date
        ).getTime();

      if (
        dateDiff !==
        0
      ) {
        return dateDiff;
      }

      /*
       * วันเดียวกัน:
       * รับก่อนจ่าย
       */

      if (
        a.type ===
          "RECEIVE" &&
        b.type ===
          "ISSUE"
      ) {
        return -1;
      }

      if (
        a.type ===
          "ISSUE" &&
        b.type ===
          "RECEIVE"
      ) {
        return 1;
      }

      return (
        a.sortId -
        b.sortId
      );
    }
  );

  /* =======================================================
     RUNNING STATE

     ใช้คำนวณตั้งแต่ประวัติแรก
     เพื่อหายอด ณ ก่อน 1 ต.ค.
  ======================================================= */

  let runningBalance =
    0;

  let historicalVendor:
    string | null =
    null;

  let historicalPrice =
    0;

  const lots:
    Lot[] =
    [];

  const movementRows:
    MovementRow[] =
    [];

  /* =======================================================
     OPENING SNAPSHOT

     จะเก็บสถานะทันที "ก่อน" movement
     ในปีงบประมาณที่เลือก
  ======================================================= */

  let openingBalance =
    0;

  let openingVendor:
    string | null =
    null;

  let openingPrice =
    0;

  let openingCaptured =
    false;

  /* =======================================================
     PROCESS HISTORY
  ======================================================= */

  for (
    const event of
      allEvents
  ) {
    const eventDate =
      new Date(
        event.date
      );

    /* =====================================================
       ก่อนเข้ารายการแรกของ FY
       เก็บยอดยกก่อน
    ===================================================== */

    if (
      !openingCaptured &&
      eventDate.getTime() >=
        fiscalRange.startDate.getTime()
    ) {
      openingBalance =
        runningBalance;

      openingVendor =
        historicalVendor;

      openingPrice =
        historicalPrice;

      openingCaptured =
        true;
    }

    /* =====================================================
       RECEIVE
    ===================================================== */

    if (
      event.type ===
      "RECEIVE"
    ) {
      const item =
        event.item;

      const qty =
        Number(
          item.qty ??
            0
        );

      const unitPrice =
        Number(
          item.unitPrice ??
            0
        );

      runningBalance +=
        qty;

      lots.push({
        id:
          item.id,

        qty,

        manufacture:
          item.manufacture,

        expiry:
          item.expiry,
      });

      historicalVendor =
        item.receive
          .vendor
          ?.name ??
        historicalVendor;

      historicalPrice =
        unitPrice;

      if (
        isDateInRange(
          item.receive
            .receiveDate,
          fiscalRange
        )
      ) {
        movementRows.push({
          date:
            item.receive
              .receiveDate,

          sortId:
            item.id,

          documentNo:
            item.receive
              .documentNo,

          owner:
            item.receive
              .vendor
              ?.name ??
            "-",

          unitPrice,

          receiveQty:
            qty,

          issueQty:
            0,

          manufacture:
            item.manufacture,

          expiry:
            item.expiry,

          type:
            "RECEIVE",
        });
      }

      continue;
    }

    /* =====================================================
       ISSUE
    ===================================================== */

    const item =
      event.item;

    const actualIssuedQty =
      getActualIssuedQty({
        qty:
          Number(
            item.qty ??
              0
          ),

        issuedQty:
          item.issuedQty,
      });

    /* =====================================================
       FEFO

       ใช้เพื่อแสดงวันผลิต/หมดอายุ
       ของ lot แรกที่ถูกตัด
    ===================================================== */

    let remainingQty =
      actualIssuedQty;

    let selectedLot:
      Lot | null =
      null;

    const availableLots =
      sortLotsByFefo(
        lots.filter(
          (
            lot
          ) =>
            lot.qty >
            0
        )
      );

    for (
      const lot of
        availableLots
    ) {
      if (
        remainingQty <=
        0
      ) {
        break;
      }

      const issueQty =
        Math.min(
          remainingQty,
          lot.qty
        );

      if (
        issueQty <=
        0
      ) {
        continue;
      }

      if (
        selectedLot ===
        null
      ) {
        selectedLot =
          lot;
      }

      lot.qty -=
        issueQty;

      remainingQty -=
        issueQty;
    }

    /*
     * คงเหลือใน Stock Card
     * คำนวณจากเอกสารรับ/จ่าย
     *
     * ไม่ใช้ Transaction.balance
     */
    runningBalance -=
      actualIssuedQty;

    if (
      isDateInRange(
        item.issue
          .issueDate,
        fiscalRange
      )
    ) {
      movementRows.push({
        date:
          item.issue
            .issueDate,

        sortId:
          item.id,

        documentNo:
          item.issue
            .documentNo,

        owner:
          item.issue
            .department
            ?.name ??
          "-",

        /*
         * ใช้ราคาซื้อล่าสุด ณ เวลาที่เกิดรายการ
         * ไม่ใช้ราคาจากอนาคต
         */
        unitPrice:
          historicalPrice,

        receiveQty:
          0,

        issueQty:
          actualIssuedQty,

        manufacture:
          selectedLot
            ?.manufacture ??
          item.manufacture ??
          null,

        expiry:
          selectedLot
            ?.expiry ??
          item.expiry ??
          null,

        type:
          "ISSUE",
      });
    }
  }

  /* =======================================================
     กรณีไม่มี movement ใน FY

     ก็ยังต้องได้ snapshot ณ 1 ต.ค.
  ======================================================= */

  if (
    !openingCaptured
  ) {
    /*
     * ถ้า allEvents ทั้งหมดอยู่ก่อน endDate
     * และไม่มี event >= startDate
     *
     * ณ จุดนี้ runningBalance คือยอดก่อน/ระหว่าง FY
     * ที่ไม่มี movement
     */
    openingBalance =
      runningBalance;

    openingVendor =
      historicalVendor;

    openingPrice =
      historicalPrice;

    openingCaptured =
      true;
  }

  /* =======================================================
     สำคัญมาก

     วิธีด้านบนถ้ามี event ใน FY
     จะ capture ถูกต้องก่อน event แรก

     แต่ถ้าไม่มี event ใน FY แล้วมี event เก่า:
     runningBalance ถูกต้อง

     ถ้ามี event ก่อน start และ event หลัง end
     เราไม่ได้โหลดหลัง end อยู่แล้ว
  ======================================================= */

  /* =======================================================
     คำนวณ opening ใหม่แบบตรงไปตรงมาอีกชั้น
     เพื่อป้องกันกรณีไม่มี event ใน FY

     RECEIVE ก่อน 1 ต.ค.
     -
     APPROVED ISSUE ก่อน 1 ต.ค.
  ======================================================= */

  const historicalReceiveTotal =
    material.receiveItems
      .filter(
        (
          item
        ) =>
          isBeforeDate(
            item.receive
              .receiveDate,
            fiscalRange.startDate
          )
      )
      .reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.qty ??
              0
          ),
        0
      );

  const historicalIssueTotal =
    material.issueItems
      .filter(
        (
          item
        ) =>
          isBeforeDate(
            item.issue
              .issueDate,
            fiscalRange.startDate
          )
      )
      .reduce(
        (
          total,
          item
        ) =>
          total +
          getActualIssuedQty({
            qty:
              Number(
                item.qty ??
                  0
              ),

            issuedQty:
              item.issuedQty,
          }),
        0
      );

  openingBalance =
    historicalReceiveTotal -
    historicalIssueTotal;

  /* =======================================================
     OPENING VENDOR + PRICE

     ต้องเป็นการซื้อครั้งล่าสุด
     ก่อน 1 ต.ค. เท่านั้น
  ======================================================= */

  const latestPurchaseBeforeOpening =
    [...material.receiveItems]
      .filter(
        (
          item
        ) =>
          isBeforeDate(
            item.receive
              .receiveDate,
            fiscalRange.startDate
          )
      )
      .sort(
        (
          a,
          b
        ) => {
          const dateDiff =
            new Date(
              b.receive
                .receiveDate
            ).getTime() -
            new Date(
              a.receive
                .receiveDate
            ).getTime();

          if (
            dateDiff !==
            0
          ) {
            return dateDiff;
          }

          return (
            b.id -
            a.id
          );
        }
      )[0] ??
    null;

  openingVendor =
    latestPurchaseBeforeOpening
      ?.receive
      ?.vendor
      ?.name ??
    null;

  openingPrice =
    latestPurchaseBeforeOpening
      ? Number(
          latestPurchaseBeforeOpening.unitPrice
        )
      : 0;

  /* =======================================================
     SORT FY MOVEMENTS
  ======================================================= */

  movementRows.sort(
    (
      a,
      b
    ) => {
      const dateDiff =
        new Date(
          a.date
        ).getTime() -
        new Date(
          b.date
        ).getTime();

      if (
        dateDiff !==
        0
      ) {
        return dateDiff;
      }

      if (
        a.type ===
          "RECEIVE" &&
        b.type ===
          "ISSUE"
      ) {
        return -1;
      }

      if (
        a.type ===
          "ISSUE" &&
        b.type ===
          "RECEIVE"
      ) {
        return 1;
      }

      return (
        a.sortId -
        b.sortId
      );
    }
  );

  /* =======================================================
     STOCK ROWS

     READ ONLY / VIRTUAL OPENING

     ไม่มี prisma.transaction.create()
  ======================================================= */

  const stockRows:
    StockRow[] =
    [];

  let yearBalance =
    openingBalance;

  /* =======================================================
     VIRTUAL OPENING ROW

     แสดงเฉพาะเมื่อ:
     - มีประวัติก่อน FY
     - และมียอดคงเหลือไม่ใช่ 0

     ไม่เขียน DB
  ======================================================= */

  const hasHistoryBeforeFiscalYear =
    material.receiveItems.some(
      (
        item
      ) =>
        isBeforeDate(
          item.receive
            .receiveDate,
          fiscalRange.startDate
        )
    ) ||
    material.issueItems.some(
      (
        item
      ) =>
        isBeforeDate(
          item.issue
            .issueDate,
          fiscalRange.startDate
        )
    );

  if (
    hasHistoryBeforeFiscalYear &&
    openingBalance !==
      0
  ) {
    stockRows.push({
      date:
        fiscalRange.startDate,

      documentNo:
        "ยอดยกเข้าระบบ",

      owner:
        openingVendor ??
        "-",

      unitPrice:
        openingPrice,

      receiveQty:
        openingBalance,

      issueQty:
        0,

      balance:
        openingBalance,

      manufacture:
        null,

      expiry:
        null,

      type:
        "OPENING_BALANCE",
    });
  }

  /* =======================================================
     FY MOVEMENTS
  ======================================================= */

  for (
    const row of
      movementRows
  ) {
    yearBalance +=
      Number(
        row.receiveQty ??
          0
      );

    yearBalance -=
      Number(
        row.issueQty ??
          0
      );

    stockRows.push({
      date:
        row.date,

      documentNo:
        row.documentNo,

      owner:
        row.owner,

      unitPrice:
        row.unitPrice,

      receiveQty:
        row.receiveQty,

      issueQty:
        row.issueQty,

      balance:
        yearBalance,

      manufacture:
        row.manufacture,

      expiry:
        row.expiry,

      type:
        row.type,
    });
  }

  /* =======================================================
     EXPORT MATERIAL
  ======================================================= */

  const exportMaterial = {
    ...material,

    vendor:
      latestReceiveItem
        ?.receive
        ?.vendor ??
      material.vendor ??
      null,

    latestPrice,
  };

  /* =======================================================
     BACK URL
  ======================================================= */

  const backHref =
    `/stock-card/${material.category}?fiscalYear=${selectedFiscalYear}`;

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
        subtitle={`${material.name} • ปีงบประมาณ ${selectedFiscalYear}`}
        actions={
          <AppButton
            href={
              backHref
            }
            variant="back"
            size="md"
            icon={
              <span
                aria-hidden="true"
              >
                ←
              </span>
            }
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          FISCAL YEAR
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
          p-4
          sm:p-5
        "
      >
        <div
          className="
            flex
            w-full
            min-w-0
            flex-col
            gap-3

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-base
                font-extrabold
                !text-slate-900
              "
            >
              ปีงบประมาณ{" "}
              {
                selectedFiscalYear
              }
            </p>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              {formatThaiFullDate(
                fiscalRange.startDate
              )}{" "}
              -{" "}
              {formatThaiFullDate(
                displayEndDate
              )}
            </p>
          </div>

          <div
            className="
              rounded-full
              bg-slate-100
              px-4
              py-2
              text-sm
              font-extrabold
              !text-slate-700
            "
          >
            📒 บัญชีปี{" "}
            {
              selectedFiscalYear
            }
          </div>
        </div>
      </AppCard>

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
                รายละเอียดข้อมูลพัสดุ ณ ปีงบประมาณ{" "}
                {
                  selectedFiscalYear
                }
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
              material={
                exportMaterial
              }
              rows={
                stockRows
              }
              fiscalYear={
                selectedFiscalYear
              }
            />

            <ExportExcel
              material={
                exportMaterial
              }
              rows={
                stockRows
              }
              fiscalYear={
                selectedFiscalYear
              }
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
              {material.code ||
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
              {material.name ||
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
              {material.unit ||
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
              {
                latestVendor
              }
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
                : latestPrice >
                    0
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
        subtitle={`ประวัติการรับเข้าและเบิกจ่าย • ปีงบประมาณ ${selectedFiscalYear} • ทั้งหมด ${stockRows.length.toLocaleString(
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
                  (
                    tableTitle
                  ) => (
                    <th
                      key={
                        tableTitle
                      }
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
                      {
                        tableTitle
                      }
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {stockRows.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={
                      9
                    }
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
                        ยังไม่มีรายการเคลื่อนไหวในปีงบประมาณ{" "}
                        {
                          selectedFiscalYear
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                stockRows.map(
                  (
                    row,
                    index
                  ) => {
                    const isOpening =
                      row.type ===
                      "OPENING_BALANCE";

                    return (
                      <tr
                        key={`${row.documentNo}-${row.date.getTime()}-${index}`}
                        className={`
                          transition-colors
                          duration-200

                          ${
                            isOpening
                              ? "bg-emerald-50/80"
                              : index %
                                    2 ===
                                  0
                                ? "bg-white"
                                : "bg-slate-50/60"
                          }

                          hover:bg-blue-50/70
                        `}
                      >
                        {/* DATE */}

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

                        {/* DOCUMENT */}

                        <td
                          className={`
                            min-w-[180px]
                            whitespace-nowrap
                            border
                            border-black
                            px-4
                            py-3.5
                            text-center
                            font-bold

                            ${
                              isOpening
                                ? "!text-emerald-800"
                                : "!text-slate-900"
                            }
                          `}
                        >
                          {row.documentNo ||
                            "-"}
                        </td>

                        {/* OWNER */}

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
                          {row.owner ||
                            "-"}
                        </td>

                        {/* PRICE */}

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

                        {/* RECEIVE */}

                        <td
                          className={`
                            min-w-[110px]
                            border
                            border-black
                            px-4
                            py-3.5
                            text-center
                            font-extrabold
                            tabular-nums

                            ${
                              isOpening
                                ? "!text-emerald-800"
                                : "!text-slate-900"
                            }
                          `}
                        >
                          {row.receiveQty >
                          0
                            ? formatNumber(
                                row.receiveQty
                              )
                            : "-"}
                        </td>

                        {/* ISSUE */}

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
                          {row.issueQty >
                          0
                            ? formatNumber(
                                row.issueQty
                              )
                            : "-"}
                        </td>

                        {/* BALANCE */}

                        <td
                          className={`
                            min-w-[110px]
                            border
                            border-black
                            px-4
                            py-3.5
                            text-center
                            font-black
                            tabular-nums

                            ${
                              isOpening
                                ? "!text-emerald-800"
                                : "!text-slate-900"
                            }
                          `}
                        >
                          {formatNumber(
                            row.balance
                          )}
                        </td>

                        {/* MANUFACTURE */}

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
                          {isOpening
                            ? "-"
                            : formatThaiShortDate(
                                row.manufacture
                              )}
                        </td>

                        {/* EXPIRY */}

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
                          {isOpening
                            ? "-"
                            : formatThaiShortDate(
                                row.expiry
                              )}
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </AppPage>
  );
}