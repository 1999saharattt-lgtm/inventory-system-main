"use client";

import "@/lib/fonts/THSarabunNew-normal";

import {
  useEffect,
  useMemo,
} from "react";

import jsPDF from "jspdf";

/* =========================================================
   TYPES
========================================================= */

type LotLabel = {
  receiveItemId: number;
  receiveId: number;
  materialId: number;

  code: string;
  name: string;
  unit: string;

  balance: number;

  manufacture: string | null;
  expiry: string | null;

  receiveDate: string | null;
  documentNo: string;
};

type LogicalLot =
  LotLabel & {
    sourceReceiveItemIds: number[];
  };

type RankedLot =
  LogicalLot & {
    lotNumber: number;
  };

type PrintableLabel =
  RankedLot & {
    copyNumber: number;
    copyTotal: number;

    productGroupKey: string;
    productGroupTitle: string;
  };

type ProductGroup = {
  key: string;
  title: string;
  labels: PrintableLabel[];
};

type Props = {
  lots: LotLabel[];
};

type DateOnly = {
  year: number;
  month: number;
  day: number;
};

/* =========================================================
   THAI MONTHS
========================================================= */

const thaiMonths = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/* =========================================================
   DATE ONLY

   ไม่ใช้ new Date()
   เพื่อป้องกัน timezone ทำวันที่เปลี่ยน
========================================================= */

function parseDateOnly(
  value: string | null
): DateOnly | null {
  if (!value) {
    return null;
  }

  const match =
    value
      .trim()
      .match(
        /^(\d{4})-(\d{2})-(\d{2})/
      );

  if (!match) {
    return null;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  if (
    year <= 0 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
  };
}

/* =========================================================
   DATE VALUE

   YYYY-MM-DD
   ->
   YYYYMMDD
========================================================= */

function dateValue(
  value: string | null
): number {
  const date =
    parseDateOnly(
      value
    );

  if (!date) {
    return Number.POSITIVE_INFINITY;
  }

  return (
    date.year * 10000 +
    date.month * 100 +
    date.day
  );
}

/* =========================================================
   FORMAT THAI DATE
========================================================= */

function formatThaiDate(
  value: string | null
): string {
  const date =
    parseDateOnly(
      value
    );

  if (!date) {
    return "-";
  }

  const day =
    String(
      date.day
    ).padStart(
      2,
      "0"
    );

  const month =
    thaiMonths[
      date.month - 1
    ];

  const buddhistYear =
    date.year + 543;

  return `${day} ${month} ${buddhistYear}`;
}

/* =========================================================
   COLOR WORDS
========================================================= */

const colorWords = [
  "black",
  "cyan",
  "magenta",
  "yellow",
  "blue",
  "red",
  "green",
  "grey",
  "gray",
  "white",
  "bk",

  "ดำ",
  "สีดำ",

  "ฟ้า",
  "สีฟ้า",
  "ไซแอน",

  "ชมพู",
  "สีชมพู",
  "มาเจนต้า",

  "แดง",
  "สีแดง",

  "เหลือง",
  "สีเหลือง",

  "น้ำเงิน",
  "สีน้ำเงิน",
];

/* =========================================================
   GENERIC WORDS
========================================================= */

const genericWords = [
  "หมึกพิมพ์",
  "หมึกเครื่องพิมพ์",
  "ตลับหมึก",
  "หมึก",
  "น้ำหมึก",

  "ตลับโทนเนอร์",
  "โทนเนอร์",

  "ชุดดรัม",
  "ตลับดรัม",
  "ดรัม",

  "ink",
  "inkjet",

  "toner",
  "cartridge",

  "drum",
  "unit",

  "original",
  "genuine",
];

/* =========================================================
   CLEAN TEXT
========================================================= */

function cleanText(
  value: string
): string {
  return value
    .replace(
      /[()[\]{}]/g,
      " "
    )
    .replace(
      /[_/,]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

/* =========================================================
   ESCAPE REGEXP
========================================================= */

function escapeRegExp(
  value: string
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/* =========================================================
   REMOVE WORD
========================================================= */

function removeWord(
  text: string,
  word: string
): string {
  const escaped =
    escapeRegExp(
      word
    );

  return text.replace(
    new RegExp(
      `(^|\\s)${escaped}(?=\\s|$)`,
      "gi"
    ),
    " "
  );
}

/* =========================================================
   PRODUCT GROUP KEY
========================================================= */

function getProductGroupKey(
  name: string
): string {
  let result =
    cleanText(
      name.toLowerCase()
    );

  const wordsToRemove = [
    ...genericWords,
    ...colorWords,
  ];

  for (
    const word of
      wordsToRemove
  ) {
    result =
      removeWord(
        result,
        word.toLowerCase()
      );
  }

  result =
    result
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  return (
    result ||
    cleanText(
      name.toLowerCase()
    )
  );
}

/* =========================================================
   PRODUCT GROUP TITLE
========================================================= */

function getProductGroupTitle(
  name: string
): string {
  let result =
    cleanText(
      name
    );

  for (
    const color of
      colorWords
  ) {
    result =
      removeWord(
        result,
        color
      );
  }

  result =
    result
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  return (
    result ||
    name
  );
}

/* =========================================================
   MATERIAL SORT
========================================================= */

function compareMaterialCode(
  a: LotLabel,
  b: LotLabel
): number {
  return a.code.localeCompare(
    b.code,
    "th",
    {
      numeric: true,
      sensitivity:
        "base",
    }
  );
}

/* =========================================================
   FEFO
========================================================= */

function compareFefo(
  a: LotLabel,
  b: LotLabel
): number {
  const expiryA =
    dateValue(
      a.expiry
    );

  const expiryB =
    dateValue(
      b.expiry
    );

  if (
    expiryA !==
    expiryB
  ) {
    return (
      expiryA -
      expiryB
    );
  }

  const manufactureA =
    dateValue(
      a.manufacture
    );

  const manufactureB =
    dateValue(
      b.manufacture
    );

  if (
    manufactureA !==
    manufactureB
  ) {
    return (
      manufactureA -
      manufactureB
    );
  }

  const receiveA =
    dateValue(
      a.receiveDate
    );

  const receiveB =
    dateValue(
      b.receiveDate
    );

  if (
    receiveA !==
    receiveB
  ) {
    return (
      receiveA -
      receiveB
    );
  }

  return (
    a.receiveItemId -
    b.receiveItemId
  );
}

/* =========================================================
   SANITIZE LOTS

   เอาเฉพาะ ReceiveItem
   ที่ยังมีของจริง
========================================================= */

function sanitizeLots(
  lots: LotLabel[]
): LotLabel[] {
  return lots
    .map(
      (lot) => ({
        ...lot,

        balance:
          Math.max(
            0,
            Math.floor(
              Number(
                lot.balance
              ) || 0
            )
          ),
      })
    )
    .filter(
      (lot) =>
        lot.balance >
        0
    );
}

/* =========================================================
   BUILD LOGICAL LOTS

   จุดแก้สำคัญ

   เดิม:
   1 ReceiveItem = 1 ล็อต

   ใหม่:
   materialId + receiveId
   =
   1 ล็อตจริง

   ตัวอย่างจากเคสปัจจุบัน:

   Receive เดียวกัน
   ReceiveItem A balance 1
   ReceiveItem B balance 2

   =>
   ล็อตเดียว balance 3

   อีก Receive
   ReceiveItem C balance 7

   =>
   อีกล็อต balance 7

   ผลลัพธ์:
   ล็อต 1 = 3
   ล็อต 2 = 7
========================================================= */

function buildLogicalLots(
  lots: LotLabel[]
): LogicalLot[] {
  const map =
    new Map<
      string,
      LotLabel[]
    >();

  for (
    const lot of
      lots
  ) {
    const key =
      `${lot.materialId}:${lot.receiveId}`;

    const current =
      map.get(
        key
      ) ?? [];

    current.push(
      lot
    );

    map.set(
      key,
      current
    );
  }

  const result:
    LogicalLot[] = [];

  for (
    const groupedItems of
      map.values()
  ) {
    if (
      groupedItems.length ===
      0
    ) {
      continue;
    }

    /*
     * เรียง ReceiveItem.id มาก -> น้อย
     *
     * record ที่ ID สูงกว่า
     * คือรายการที่สร้าง/แก้ทีหลัง
     *
     * ใช้เป็นข้อมูลหลักของวันที่
     * เพื่อไม่ดึง record เก่าที่ค้างอยู่
     */
    const newestFirst =
      [
        ...groupedItems,
      ].sort(
        (a, b) =>
          b.receiveItemId -
          a.receiveItemId
      );

    const newest =
      newestFirst[0];

    /*
     * ยอดคงเหลือของล็อตจริง
     * =
     * ผลรวม balance ของ ReceiveItem
     * ภายในใบรับเดียวกัน
     */
    const totalBalance =
      groupedItems.reduce(
        (
          total,
          item
        ) =>
          total +
          Math.max(
            0,
            Math.floor(
              Number(
                item.balance
              ) || 0
            )
          ),
        0
      );

    if (
      totalBalance <= 0
    ) {
      continue;
    }

    /*
     * วันผลิต / วันหมดอายุ
     *
     * ใช้ค่าจาก ReceiveItem ล่าสุดก่อน
     *
     * ถ้ารายการล่าสุดไม่มีค่า
     * ค่อยย้อนหาค่าที่มีอยู่
     */
    const manufacture =
      newestFirst.find(
        (item) =>
          Boolean(
            item.manufacture
          )
      )?.manufacture ??
      null;

    const expiry =
      newestFirst.find(
        (item) =>
          Boolean(
            item.expiry
          )
      )?.expiry ??
      null;

    /*
     * receiveDate + documentNo
     * เป็นข้อมูลระดับ Receive อยู่แล้ว
     */
    const receiveDate =
      newest.receiveDate;

    const documentNo =
      newest.documentNo;

    result.push({
      ...newest,

      balance:
        totalBalance,

      manufacture,

      expiry,

      receiveDate,

      documentNo,

      sourceReceiveItemIds:
        groupedItems
          .map(
            (item) =>
              item.receiveItemId
          )
          .sort(
            (a, b) =>
              a - b
          ),
    });
  }

  return result;
}

/* =========================================================
   BUILD LOT NUMBER

   Group ตาม materialId

   ภายใน Material:
   เรียง FEFO แล้วค่อยให้
   ล็อต 1, 2, 3...
========================================================= */

function buildRankedLots(
  lots: LogicalLot[]
): RankedLot[] {
  const materialMap =
    new Map<
      number,
      LogicalLot[]
    >();

  for (
    const lot of
      lots
  ) {
    const current =
      materialMap.get(
        lot.materialId
      ) ?? [];

    current.push(
      lot
    );

    materialMap.set(
      lot.materialId,
      current
    );
  }

  const materialGroups =
    Array.from(
      materialMap.values()
    ).sort(
      (a, b) => {
        if (
          !a[0] ||
          !b[0]
        ) {
          return 0;
        }

        return compareMaterialCode(
          a[0],
          b[0]
        );
      }
    );

  const result:
    RankedLot[] = [];

  for (
    const materialLots of
      materialGroups
  ) {
    const sortedLots =
      [
        ...materialLots,
      ].sort(
        compareFefo
      );

    sortedLots.forEach(
      (
        lot,
        index
      ) => {
        result.push({
          ...lot,

          lotNumber:
            index + 1,
        });
      }
    );
  }

  return result;
}

/* =========================================================
   EXPAND PHYSICAL LABELS

   LogicalLot.balance = 3
   =>
   3 ป้าย
========================================================= */

function expandPrintableLabels(
  rankedLots: RankedLot[]
): PrintableLabel[] {
  const result:
    PrintableLabel[] = [];

  for (
    const lot of
      rankedLots
  ) {
    const quantity =
      Math.max(
        0,
        Math.floor(
          Number(
            lot.balance
          )
        )
      );

    if (
      quantity <= 0
    ) {
      continue;
    }

    const productGroupKey =
      getProductGroupKey(
        lot.name
      );

    const productGroupTitle =
      getProductGroupTitle(
        lot.name
      );

    for (
      let copyNumber = 1;
      copyNumber <=
      quantity;
      copyNumber++
    ) {
      result.push({
        ...lot,

        copyNumber,

        copyTotal:
          quantity,

        productGroupKey,

        productGroupTitle,
      });
    }
  }

  return result;
}

/* =========================================================
   BUILD PRODUCT GROUPS
========================================================= */

function buildProductGroups(
  labels: PrintableLabel[]
): ProductGroup[] {
  const map =
    new Map<
      string,
      ProductGroup
    >();

  for (
    const label of
      labels
  ) {
    const existing =
      map.get(
        label.productGroupKey
      );

    if (existing) {
      existing.labels.push(
        label
      );

      continue;
    }

    map.set(
      label.productGroupKey,
      {
        key:
          label.productGroupKey,

        title:
          label.productGroupTitle,

        labels: [
          label,
        ],
      }
    );
  }

  const groups =
    Array.from(
      map.values()
    );

  groups.sort(
    (a, b) =>
      a.title.localeCompare(
        b.title,
        "th",
        {
          numeric: true,
          sensitivity:
            "base",
        }
      )
  );

  for (
    const group of
      groups
  ) {
    group.labels.sort(
      (a, b) => {
        const nameCompare =
          a.name.localeCompare(
            b.name,
            "th",
            {
              numeric: true,
              sensitivity:
                "base",
            }
          );

        if (
          nameCompare !==
          0
        ) {
          return nameCompare;
        }

        if (
          a.lotNumber !==
          b.lotNumber
        ) {
          return (
            a.lotNumber -
            b.lotNumber
          );
        }

        return (
          a.copyNumber -
          b.copyNumber
        );
      }
    );
  }

  return groups;
}

/* =========================================================
   FIT SINGLE LINE
========================================================= */

function fitSingleLineText(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  startFontSize: number,
  minFontSize: number
): number {
  let fontSize =
    startFontSize;

  doc.setFontSize(
    fontSize
  );

  while (
    doc.getTextWidth(
      text
    ) >
      maxWidth &&
    fontSize >
      minFontSize
  ) {
    fontSize -=
      0.25;

    doc.setFontSize(
      fontSize
    );
  }

  return fontSize;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ComputerLotLabelsPdf({
  lots,
}: Props) {
  /* =======================================================
     CURRENT RECEIVE ITEMS
  ======================================================= */

  const currentLots =
    useMemo(
      () =>
        sanitizeLots(
          lots
        ),
      [lots]
    );

  /* =======================================================
     LOGICAL LOTS

     รวม ReceiveItem ที่อยู่ในใบรับเดียวกัน
  ======================================================= */

  const logicalLots =
    useMemo(
      () =>
        buildLogicalLots(
          currentLots
        ),
      [currentLots]
    );

  /* =======================================================
     FEFO + LOT NUMBER
  ======================================================= */

  const rankedLots =
    useMemo(
      () =>
        buildRankedLots(
          logicalLots
        ),
      [logicalLots]
    );

  /* =======================================================
     PHYSICAL LABELS
  ======================================================= */

  const printableLabels =
    useMemo(
      () =>
        expandPrintableLabels(
          rankedLots
        ),
      [rankedLots]
    );

  /* =======================================================
     PRODUCT GROUPS
  ======================================================= */

  const productGroups =
    useMemo(
      () =>
        buildProductGroups(
          printableLabels
        ),
      [
        printableLabels,
      ]
    );

  /* =======================================================
     CREATE PDF
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    let objectUrl:
      string | null =
      null;

    function createPdf() {
      try {
        if (
          productGroups.length ===
          0
        ) {
          document.body.innerHTML =
            '<div style="font-family:sans-serif;padding:40px;text-align:center;">ไม่พบรายการหมึกที่มีคงเหลือ</div>';

          return;
        }

        const doc =
          new jsPDF({
            orientation:
              "portrait",

            unit:
              "mm",

            format:
              "a4",

            compress:
              false,
          });

        doc.setFont(
          "2.3.2 THSarabunNew",
          "normal"
        );

        /* =================================================
           PAGE
        ================================================= */

        const pageWidth =
          210;

        const pageHeight =
          297;

        const marginX =
          5;

        const marginTop =
          6;

        const marginBottom =
          6;

        const contentBottom =
          pageHeight -
          marginBottom;

        /* =================================================
           LABEL SIZE

           4 ป้ายต่อแถว
           ประมาณ 48 × 28 mm
        ================================================= */

        const columns =
          4;

        const gapX =
          1.5;

        const gapY =
          1.8;

        const cardWidth =
          (
            pageWidth -
            marginX * 2 -
            gapX *
              (
                columns -
                1
              )
          ) /
          columns;

        const cardHeight =
          28;

        /* =================================================
           GROUP
        ================================================= */

        const groupHeaderHeight =
          9;

        const groupGap =
          3;

        let currentY =
          marginTop;

        /* =================================================
           NEW PAGE
        ================================================= */

        function addNewPage() {
          doc.addPage();

          currentY =
            marginTop;
        }

        /* =================================================
           GROUP HEADER
        ================================================= */

        function drawGroupHeader(
          title: string,
          count: number
        ) {
          doc.setTextColor(
            0,
            0,
            0
          );

          doc.setFont(
            "2.3.2 THSarabunNew",
            "normal"
          );

          fitSingleLineText(
            doc,
            title,
            pageWidth -
              marginX *
                2 -
              40,
            16,
            11
          );

          doc.text(
            title,
            marginX,
            currentY +
              5
          );

          doc.setFontSize(
            10
          );

          doc.text(
            count.toLocaleString(
              "th-TH"
            ) +
              " ป้าย",

            pageWidth -
              marginX,

            currentY +
              5,

            {
              align:
                "right",
            }
          );

          doc.setDrawColor(
            100,
            100,
            100
          );

          doc.setLineWidth(
            0.25
          );

          doc.line(
            marginX,

            currentY +
              6.8,

            pageWidth -
              marginX,

            currentY +
              6.8
          );

          currentY +=
            groupHeaderHeight;
        }

        /* =================================================
           DRAW LABEL
        ================================================= */

        function drawLabel(
          label:
            PrintableLabel,
          x: number,
          y: number
        ) {
          /* -----------------------------------------------
             BORDER
          ----------------------------------------------- */

          doc.setDrawColor(
            30,
            30,
            30
          );

          doc.setLineWidth(
            0.25
          );

          doc.rect(
            x,
            y,
            cardWidth,
            cardHeight
          );

          doc.setTextColor(
            0,
            0,
            0
          );

          doc.setFont(
            "2.3.2 THSarabunNew",
            "normal"
          );

          /* -----------------------------------------------
             CODE
          ----------------------------------------------- */

          fitSingleLineText(
            doc,
            `รหัส ${label.code}`,
            cardWidth -
              4,
            9.5,
            7
          );

          doc.text(
            `รหัส ${label.code}`,

            x +
              cardWidth /
                2,

            y +
              3.8,

            {
              align:
                "center",
            }
          );

          /* -----------------------------------------------
             NAME
          ----------------------------------------------- */

          fitSingleLineText(
            doc,
            label.name,
            cardWidth -
              4,
            10,
            6.5
          );

          doc.text(
            label.name,

            x +
              cardWidth /
                2,

            y +
              7.4,

            {
              align:
                "center",
            }
          );

          /* -----------------------------------------------
             LOT
          ----------------------------------------------- */

          doc.setFontSize(
            11
          );

          doc.text(
            `ล็อต ${label.lotNumber}   ${label.copyNumber}/${label.copyTotal}`,

            x +
              cardWidth /
                2,

            y +
              11.8,

            {
              align:
                "center",
            }
          );

          /* -----------------------------------------------
             DIVIDER
          ----------------------------------------------- */

          doc.setDrawColor(
            165,
            165,
            165
          );

          doc.setLineWidth(
            0.18
          );

          doc.line(
            x + 2,
            y + 13,

            x +
              cardWidth -
              2,

            y + 13
          );

          /* -----------------------------------------------
             DATE POSITION
          ----------------------------------------------- */

          const dateLabelX =
            x + 3;

          const colonX =
            x + 18;

          const dateValueX =
            x + 21;

          /* -----------------------------------------------
             MANUFACTURE
          ----------------------------------------------- */

          doc.setFontSize(
            11
          );

          doc.text(
            "วันผลิต",
            dateLabelX,
            y + 18.3
          );

          doc.text(
            ":",
            colonX,
            y + 18.3
          );

          fitSingleLineText(
            doc,
            formatThaiDate(
              label.manufacture
            ),
            cardWidth -
              23,
            11,
            8.5
          );

          doc.text(
            formatThaiDate(
              label.manufacture
            ),
            dateValueX,
            y + 18.3
          );

          /* -----------------------------------------------
             EXPIRY
          ----------------------------------------------- */

          doc.setFontSize(
            11
          );

          doc.text(
            "วันหมดอายุ",
            dateLabelX,
            y + 24
          );

          doc.text(
            ":",
            colonX,
            y + 24
          );

          fitSingleLineText(
            doc,
            formatThaiDate(
              label.expiry
            ),
            cardWidth -
              23,
            11,
            8.5
          );

          doc.text(
            formatThaiDate(
              label.expiry
            ),
            dateValueX,
            y + 24
          );
        }

        /* =================================================
           PRODUCT GROUPS
        ================================================= */

        for (
          const group of
            productGroups
        ) {
          if (
            cancelled
          ) {
            return;
          }

          const minimumHeight =
            groupHeaderHeight +
            cardHeight +
            gapY;

          if (
            currentY +
              minimumHeight >
            contentBottom
          ) {
            addNewPage();
          }

          drawGroupHeader(
            group.title,
            group.labels.length
          );

          let labelIndex =
            0;

          while (
            labelIndex <
            group.labels.length
          ) {
            if (
              currentY +
                cardHeight >
              contentBottom
            ) {
              addNewPage();

              drawGroupHeader(
                `${group.title} (ต่อ)`,
                group.labels.length
              );
            }

            for (
              let column = 0;
              column <
                columns &&
              labelIndex <
                group.labels.length;
              column++
            ) {
              const x =
                marginX +
                column *
                  (
                    cardWidth +
                    gapX
                  );

              drawLabel(
                group.labels[
                  labelIndex
                ],
                x,
                currentY
              );

              labelIndex +=
                1;
            }

            currentY +=
              cardHeight +
              gapY;
          }

          currentY +=
            groupGap;
        }

        if (
          cancelled
        ) {
          return;
        }

        /* =================================================
           OPEN PDF
        ================================================= */

        const blob =
          doc.output(
            "blob"
          );

        objectUrl =
          URL.createObjectURL(
            blob
          );

        window.location.replace(
          objectUrl
        );
      } catch (
        error
      ) {
        console.error(
          "ไม่สามารถสร้าง PDF ป้ายล็อตได้:",
          error
        );

        document.body.innerHTML =
          '<div style="font-family:sans-serif;padding:40px;text-align:center;">ไม่สามารถเปิด PDF ป้ายล็อตได้</div>';
      }
    }

    createPdf();

    return () => {
      cancelled =
        true;

      if (
        objectUrl
      ) {
        URL.revokeObjectURL(
          objectUrl
        );
      }
    };
  }, [
    productGroups,
  ]);

  return null;
}