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

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

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

type Lot = {
  id: number;

  qty: number;

  manufacture:
    Date | null;

  expiry:
    Date | null;
};

type FiscalYearRange = {
  fiscalYearThai:
    number;

  fiscalYearGregorian:
    number;

  startDate:
    Date;

  endDate:
    Date;
};

type ThailandDateParts = {
  year: number;
  month: number;
  day: number;
};

type StockRow = {
  date: Date;

  documentNo:
    string;

  owner:
    string;

  unitPrice:
    number;

  receiveQty:
    number;

  issueQty:
    number;

  balance:
    number;

  manufacture:
    Date | null;

  expiry:
    Date | null;

  type:
    string;
};

/* =========================================================
   CATEGORY
========================================================= */

const categoryName:
  Record<string, string> = {
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
  range:
    FiscalYearRange
) {
  return new Date(
    range.endDate.getTime() -
      24 *
        60 *
        60 *
        1000
  );
}

/* =========================================================
   DATE IN RANGE
========================================================= */

function isDateInRange(
  value: Date,
  range:
    FiscalYearRange
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

   01 ต.ค. 69
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
   CREATE OPENING BALANCE FOR ONE MATERIAL

   ใช้กรณีเปิดหน้ารายวัสดุโดยตรง
   โดยไม่ได้ผ่าน /stock-card ก่อน

   หลัก:
   - สร้างเพียงครั้งเดียว
   - ไม่เพิ่ม Material.balance
   - ไม่เพิ่ม ReceiveItem.balance
========================================================= */

async function ensureMaterialOpeningBalance(
  materialId: number,
  fiscalYearThai: number
) {
  const range =
    getFiscalYearRange(
      fiscalYearThai
    );

  /* =======================================================
     CHECK EXISTING
  ======================================================= */

  const existing =
    await prisma.transaction.findFirst({
      where: {
        materialId,

        type:
          "OPENING_BALANCE",

        documentNo:
          "ยอดยกเข้าระบบ",

        date: {
          gte:
            range.startDate,

          lt:
            new Date(
              range.startDate.getTime() +
                24 *
                  60 *
                  60 *
                  1000
            ),
        },
      },

      select: {
        id:
          true,
      },
    });

  if (existing) {
    return;
  }

  /* =======================================================
     LAST TRANSACTION BEFORE FY

     ใช้ balance ณ สิ้นปีงบเดิม
  ======================================================= */

  const lastTransaction =
    await prisma.transaction.findFirst({
      where: {
        materialId,

        date: {
          lt:
            range.startDate,
        },
      },

      orderBy: [
        {
          date:
            "desc",
        },

        {
          id:
            "desc",
        },
      ],

      select: {
        balance:
          true,

        unitPrice:
          true,

        vendor:
          true,
      },
    });

  let openingBalance =
    lastTransaction
      ? Math.max(
          0,
          Math.floor(
            Number(
              lastTransaction.balance ??
                0
            )
          )
        )
      : 0;

  /* =======================================================
     FALLBACK

     กรณีข้อมูลเก่าไม่มี Transaction
     ให้คำนวณจากเอกสารรับและเบิกที่ APPROVED
     ก่อนวันที่ 1 ต.ค.
  ======================================================= */

  if (
    !lastTransaction
  ) {
    const [
      receiveItems,
      issueItems,
    ] =
      await Promise.all([
        prisma.receiveItem.findMany({
          where: {
            materialId,

            receive: {
              receiveDate: {
                lt:
                  range.startDate,
              },
            },
          },

          select: {
            qty:
              true,
          },
        }),

        prisma.issueItem.findMany({
          where: {
            materialId,

            issue: {
              issueDate: {
                lt:
                  range.startDate,
              },

              status:
                "APPROVED",
            },
          },

          select: {
            qty:
              true,

            issuedQty:
              true,
          },
        }),
      ]);

    const totalReceive =
      receiveItems.reduce(
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

    const totalIssue =
      issueItems.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.issuedQty ??
              item.qty ??
              0
          ),
        0
      );

    openingBalance =
      Math.max(
        0,
        totalReceive -
          totalIssue
      );
  }

  /* =======================================================
     ไม่มีของเหลือ
  ======================================================= */

  if (
    openingBalance <=
    0
  ) {
    return;
  }

  /* =======================================================
     LATEST PURCHASE BEFORE FY

     ถ้าปีก่อนไม่ได้ซื้อ
     ย้อนหาการซื้อก่อนหน้านั้นไปเรื่อย ๆ
  ======================================================= */

  const latestPurchase =
    await prisma.receiveItem.findFirst({
      where: {
        materialId,

        receive: {
          receiveDate: {
            lt:
              range.startDate,
          },
        },
      },

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

      select: {
        unitPrice:
          true,

        receive: {
          select: {
            vendor: {
              select: {
                name:
                  true,
              },
            },
          },
        },
      },
    });

  const material =
    await prisma.material.findUnique({
      where: {
        id:
          materialId,
      },

      select: {
        latestPrice:
          true,

        vendor: {
          select: {
            name:
              true,
          },
        },
      },
    });

  const vendorName =
    latestPurchase
      ?.receive
      ?.vendor
      ?.name ??
    lastTransaction
      ?.vendor ??
    material
      ?.vendor
      ?.name ??
    null;

  const unitPrice =
    Number(
      latestPurchase
        ?.unitPrice ??
        lastTransaction
          ?.unitPrice ??
        material
          ?.latestPrice ??
        0
    );

  /* =======================================================
     CREATE

     ช่องรับ = ยอดคงเหลือต้นปี
     ช่องคงเหลือ = ยอดคงเหลือต้นปี
  ======================================================= */

  await prisma.transaction.create({
    data: {
      materialId,

      date:
        range.startDate,

      type:
        "OPENING_BALANCE",

      documentNo:
        "ยอดยกเข้าระบบ",

      receiveQty:
        openingBalance,

      issueQty:
        0,

      balance:
        openingBalance,

      unitPrice,

      vendor:
        vendorName,

      department:
        null,

      remark:
        `ยอดยกเข้าปีงบประมาณ ${fiscalYearThai}`,
    },
  });
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
     ENSURE OPENING BALANCE
  ======================================================= */

  await ensureMaterialOpeningBalance(
    materialId,
    selectedFiscalYear
  );

  /* =======================================================
     MATERIAL

     โหลดเฉพาะประวัติที่เกิดก่อนสิ้นปีงบประมาณที่เลือก

     เพราะการคำนวณ FEFO ของรายการเบิกในปีนั้น
     ต้องรู้ล็อตที่มาจากอดีตด้วย
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

          orderBy: {
            receive: {
              receiveDate:
                "asc",
            },
          },
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

          orderBy: {
            issue: {
              issueDate:
                "asc",
            },
          },
        },
      },
    });

  if (!material) {
    notFound();
  }

  /* =======================================================
     LATEST PURCHASE AS OF SELECTED FY

     ห้ามเอาการซื้อในอนาคตมาปน
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
     FEFO LOTS

     ต้องประมวลผลตั้งแต่ประวัติแรก
     จนถึงสิ้น FY ที่เลือก

     เพื่อให้การเบิกใน FY ที่เลือก
     รู้ว่ากำลังตัด lot ใด
  ======================================================= */

  const lots:
    Lot[] =
    [];

  /* =======================================================
     EVENTS
  ======================================================= */

  const events = [
    ...material.receiveItems.map(
      (
        item
      ) => ({
        type:
          "receive" as const,

        date:
          item.receive.receiveDate,

        item,
      })
    ),

    ...material.issueItems.map(
      (
        item
      ) => ({
        type:
          "issue" as const,

        date:
          item.issue.issueDate,

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
       * วันเดียวกัน
       * รับก่อนจ่าย
       */

      if (
        a.type ===
          "receive" &&
        b.type ===
          "issue"
      ) {
        return -1;
      }

      if (
        a.type ===
          "issue" &&
        b.type ===
          "receive"
      ) {
        return 1;
      }

      return 0;
    }
  );

  /* =======================================================
     ISSUE LOT MAP
  ======================================================= */

  const issueLotMap =
    new Map<
      number,
      {
        manufacture:
          Date | null;

        expiry:
          Date | null;
      }
    >();

  /* =======================================================
     FEFO PROCESS
  ======================================================= */

  for (
    const event of
      events
  ) {
    if (
      event.type ===
      "receive"
    ) {
      const receiveItem =
        event.item;

      lots.push({
        id:
          receiveItem.id,

        qty:
          Number(
            receiveItem.qty
          ),

        manufacture:
          receiveItem.manufacture,

        expiry:
          receiveItem.expiry,
      });

      continue;
    }

    const issueItem =
      event.item;

    let remainingQty =
      Number(
        issueItem.issuedQty ??
          issueItem.qty ??
          0
      );

    const availableLots =
      lots
        .filter(
          (
            lot
          ) =>
            lot.qty >
            0
        )
        .sort(
          (
            a,
            b
          ) => {
            /*
             * lot ที่ไม่มี manufacture/expiry
             * ให้มาก่อนตาม logic เดิมของระบบ
             */

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
              return (
                a.id -
                b.id
              );
            }

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

            if (
              aExpiry !==
              bExpiry
            ) {
              return (
                aExpiry -
                bExpiry
              );
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

            return (
              a.id -
              b.id
            );
          }
        );

    let selectedLot:
      Lot | null =
      null;

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
        !selectedLot
      ) {
        selectedLot =
          lot;
      }

      lot.qty -=
        issueQty;

      remainingQty -=
        issueQty;
    }

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

  /* =======================================================
     OPENING BALANCE TRANSACTION

     ต้องเป็นแถวแรกของปีงบ
  ======================================================= */

  const openingTransaction =
    await prisma.transaction.findFirst({
      where: {
        materialId,

        type:
          "OPENING_BALANCE",

        documentNo:
          "ยอดยกเข้าระบบ",

        date: {
          gte:
            fiscalRange.startDate,

          lt:
            new Date(
              fiscalRange.startDate.getTime() +
                24 *
                  60 *
                  60 *
                  1000
            ),
        },
      },

      orderBy: [
        {
          date:
            "asc",
        },

        {
          id:
            "asc",
        },
      ],
    });

  /* =======================================================
     YEAR RECEIVE ROWS

     รับเฉพาะรายการใน FY ที่เลือก

     ยอดยกเข้าระบบไม่ซ้ำกับ Receive จริง
  ======================================================= */

  const receiveRows =
    material.receiveItems
      .filter(
        (
          item
        ) =>
          isDateInRange(
            item.receive
              .receiveDate,
            fiscalRange
          ) &&
          item.receive
            .documentNo !==
            "ยอดยกเข้าระบบ"
      )
      .map(
        (
          item
        ) => ({
          date:
            item.receive
              .receiveDate,

          documentNo:
            item.receive
              .documentNo,

          owner:
            item.receive
              .vendor
              ?.name ??
            "-",

          unitPrice:
            Number(
              item.unitPrice
            ),

          receiveQty:
            Number(
              item.qty
            ),

          issueQty:
            0,

          manufacture:
            item.manufacture,

          expiry:
            item.expiry,

          type:
            "RECEIVE",
        })
      );

  /* =======================================================
     YEAR ISSUE ROWS
  ======================================================= */

  const issueRows =
    material.issueItems
      .filter(
        (
          item
        ) =>
          isDateInRange(
            item.issue.issueDate,
            fiscalRange
          )
      )
      .map(
        (
          item
        ) => {
          const lot =
            issueLotMap.get(
              item.id
            );

          return {
            date:
              item.issue
                .issueDate,

            documentNo:
              item.issue
                .documentNo,

            owner:
              item.issue
                .department
                ?.name ??
              "-",

            /*
             * คงพฤติกรรมเดิม:
             * รายการเบิกใช้ราคาล่าสุด
             * ณ FY ที่กำลังดู
             */

            unitPrice:
              latestPrice,

            receiveQty:
              0,

            issueQty:
              Number(
                item.issuedQty ??
                  item.qty ??
                  0
              ),

            manufacture:
              lot
                ?.manufacture ??
              null,

            expiry:
              lot
                ?.expiry ??
              null,

            type:
              "ISSUE",
          };
        }
      );

  /* =======================================================
     MOVEMENT ROWS

     รับก่อนจ่าย ถ้าวันเดียวกัน
  ======================================================= */

  const movementRows =
    [
      ...receiveRows,
      ...issueRows,
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

        return 0;
      }
    );

  /* =======================================================
     STOCK ROWS

     จุดสำคัญ:

     ถ้ามียอดยก:
       แถวแรก
       รับ = opening balance
       คงเหลือ = opening balance

     แล้วค่อยรับ/จ่ายต่อจากยอดนั้น
  ======================================================= */

  const stockRows:
    StockRow[] =
    [];

  let balance =
    0;

  /* =======================================================
     OPENING ROW
  ======================================================= */

  if (
    openingTransaction
  ) {
    const openingBalance =
      Math.max(
        0,
        Number(
          openingTransaction
            .balance ??
            openingTransaction
              .receiveQty ??
            0
        )
      );

    balance =
      openingBalance;

    stockRows.push({
      date:
        openingTransaction
          .date,

      documentNo:
        "ยอดยกเข้าระบบ",

      owner:
        openingTransaction
          .vendor ??
        latestVendor ??
        "-",

      unitPrice:
        Number(
          openingTransaction
            .unitPrice ??
            latestPrice ??
            0
        ),

      /*
       * ตามที่กำหนด:
       *
       * ช่องรับ
       * =
       * จำนวนคงเหลือต้นปี
       */

      receiveQty:
        openingBalance,

      issueQty:
        0,

      /*
       * ช่องคงเหลือ
       * =
       * จำนวนเดียวกัน
       */

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
     MOVEMENTS
  ======================================================= */

  for (
    const row of
      movementRows
  ) {
    balance +=
      Number(
        row.receiveQty ??
          0
      );

    balance -=
      Number(
        row.issueQty ??
          0
      );

    stockRows.push({
      ...row,

      balance,
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
            min-w-0
            flex-col

            gap-3

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div
            className="
              min-w-0
            "
          >
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
        {/* ===================================================
            HEADER + EXPORT
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

            <div
              className="
                min-w-0
              "
            >
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
                รายละเอียดข้อมูลพัสดุและข้อมูลล่าสุด ณ ปีงบประมาณ{" "}
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
              material={exportMaterial}
              rows={stockRows}
              fiscalYear={selectedFiscalYear}
            />

            <ExportExcel
              material={exportMaterial}
              rows={stockRows}
              fiscalYear={selectedFiscalYear}
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
          {/* CODE */}

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

          {/* NAME */}

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

          {/* CATEGORY */}

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

          {/* UNIT */}

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

          {/* VENDOR */}

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

          {/* PRICE */}

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
            {/* =================================================
                HEADER
            ================================================= */}

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

            {/* =================================================
                BODY
            ================================================= */}

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