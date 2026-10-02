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

type RankedLot =
  LotLabel & {
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

   สำคัญมาก:
   ห้ามใช้ new Date(value)
   ห้ามใช้ getDate / getMonth / getFullYear

   รับได้ทั้ง:
   2026-09-01
   2026-09-01T00:00:00.000Z

   แต่จะอ่านเฉพาะ YYYY-MM-DD
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

   ใช้สำหรับเรียง FEFO

   YYYY-MM-DD
   =>
   YYYYMMDD

   เช่น:
   2026-09-01
   =>
   20260901

   ไม่มีวันที่ = Infinity
   จึงอยู่ท้าย
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
    date.year *
      10000 +
    date.month *
      100 +
    date.day
  );
}

/* =========================================================
   FORMAT THAI DATE

   ไม่ผ่าน timezone

   2026-09-01
   =>
   01 ก.ย. 2569
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

   ใช้เฉพาะจัดกลุ่มหัวข้อ
   ไม่แตะ ReceiveItem / LOT
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

   ใช้เฉพาะเพื่อจัดหัวข้อ

   ตัวอย่าง:

   Canon CLI-751 Black
   Canon CLI-751 Cyan
   Canon CLI-751 Yellow

   =>
   Canon CLI-751

   ไม่รวม ReceiveItem
   ไม่รวม balance
   ไม่รวมวันที่
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

   ลำดับ:
   1. วันหมดอายุเร็วที่สุด
   2. วันผลิตเก่าที่สุด
   3. วันรับเข้าเก่าที่สุด
   4. ReceiveItem.id น้อยที่สุด

   ไม่มีวันหมดอายุ = อยู่ท้าย

   ทุกวันที่ compare แบบ YYYYMMDD
   ไม่ผ่าน JavaScript timezone
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

   ป้ายต้องสร้างจาก ReceiveItem ที่ยังเหลือจริงเท่านั้น

   balance:
   - ต้องเป็นจำนวนเต็ม
   - ต้อง > 0

   ไม่ใช้ qty เดิม
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
   BUILD LOT NUMBER

   LOT NUMBER แยกตาม materialId

   1 ReceiveItem
   =
   1 ล็อตจริง

   ห้าม merge ReceiveItem
========================================================= */

function buildRankedLots(
  lots: LotLabel[]
): RankedLot[] {
  const materialMap =
    new Map<
      number,
      LotLabel[]
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

   สำคัญ:

   ReceiveItem.balance = 3
   =>
   สร้าง 3 ป้าย

   ทุกป้าย:
   - material เดียวกัน
   - receiveItemId เดียวกัน
   - วันผลิตเดียวกัน
   - วันหมดอายุเดียวกัน

   ไม่มีการเอา qty เดิมมาสร้างป้าย
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
   BUILD GROUPS

   การรวมตรงนี้เป็นเพียงการจัดหน้ากระดาษ

   ไม่รวม:
   - ReceiveItem
   - balance
   - lotNumber
   - manufacture
   - expiry
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

        const fefo =
          compareFefo(
            a,
            b
          );

        if (
          fefo !== 0
        ) {
          return fefo;
        }

        if (
          a.receiveItemId !==
          b.receiveItemId
        ) {
          return (
            a.receiveItemId -
            b.receiveItemId
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
     CLEAN CURRENT STOCK

     จำนวนป้ายอิงจาก balance ของ ReceiveItem เท่านั้น
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
     FEFO + LOT NUMBER
  ======================================================= */

  const rankedLots =
    useMemo(
      () =>
        buildRankedLots(
          currentLots
        ),
      [currentLots]
    );

  /* =======================================================
     1 BALANCE = 1 PHYSICAL LABEL
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
     GROUP FOR PDF LAYOUT
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
           LABEL

           4 ป้าย / แถว

           ประมาณ:
           48.875 × 28 mm
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

             1 บรรทัด
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

             lotNumber = ลำดับล็อต FEFO
             copyNumber/copyTotal = เลขป้ายของ balance ล็อตนั้น
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

          /* -----------------------------------------------
             ต้องเหลือพื้นที่พอสำหรับ
             Header + ป้าย 1 แถว
          ----------------------------------------------- */

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

          /* -----------------------------------------------
             LABEL ROWS
          ----------------------------------------------- */

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