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
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

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
   DATE VALUE
========================================================= */

function dateValue(
  value: string | null
): number {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const time =
    new Date(value).getTime();

  if (
    Number.isNaN(time)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  return time;
}

/* =========================================================
   FORMAT THAI DATE
========================================================= */

function formatThaiDate(
  value: string | null
): string {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  const month =
    thaiMonths[
      date.getMonth()
    ];

  const year =
    date.getFullYear() +
    543;

  return (
    day +
    " " +
    month +
    " " +
    year
  );
}

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
      "(^|\\s)" +
        escaped +
        "(?=\\s|$)",
      "gi"
    ),
    " "
  );
}

/* =========================================================
   GROUP KEY
========================================================= */

function getProductGroupKey(
  name: string
): string {
  let result =
    cleanText(
      name.toLowerCase()
    );

  const removeWords = [
    ...genericWords,
    ...colorWords,
  ];

  for (
    const word of
    removeWords
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
   GROUP TITLE
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
   SORT MATERIAL
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
      sensitivity: "base",
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
   BUILD LOTS
========================================================= */

function buildRankedLots(
  lots: LotLabel[]
): RankedLot[] {
  const map =
    new Map<
      number,
      LotLabel[]
    >();

  for (
    const lot of lots
  ) {
    const current =
      map.get(
        lot.materialId
      ) ?? [];

    current.push(
      lot
    );

    map.set(
      lot.materialId,
      current
    );
  }

  const groups =
    Array.from(
      map.values()
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
    const group of
    groups
  ) {
    const sorted =
      [...group].sort(
        compareFefo
      );

    sorted.forEach(
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
   EXPAND LABELS
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
   GROUP PRODUCTS
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
          nameCompare !== 0
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
   FIT TEXT
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
  const rankedLots =
    useMemo(
      () =>
        buildRankedLots(
          lots
        ),
      [lots]
    );

  const printableLabels =
    useMemo(
      () =>
        expandPrintableLabels(
          rankedLots
        ),
      [rankedLots]
    );

  const productGroups =
    useMemo(
      () =>
        buildProductGroups(
          printableLabels
        ),
      [printableLabels]
    );

  /* =======================================================
     CREATE PDF
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

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
           PAGE CONFIG
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
           LABEL CONFIG
        ================================================= */

        const columns =
          5;

        const gapX =
          1.5;

        const gapY =
          1.5;

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
          22;

        /* =================================================
           GROUP HEADER
        ================================================= */

        const groupHeaderHeight =
          8;

        const groupGap =
          3;

        /* =================================================
           CURRENT CURSOR
        ================================================= */

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
           DRAW GROUP HEADER
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
              marginX * 2 -
              35,
            14,
            9
          );

          doc.text(
            title,
            marginX,
            currentY + 4.5
          );

          doc.setFontSize(
            8.5
          );

          doc.text(
            count.toLocaleString(
              "th-TH"
            ) +
              " ป้าย",
            pageWidth -
              marginX,
            currentY + 4.5,
            {
              align:
                "right",
            }
          );

          doc.setDrawColor(
            130,
            130,
            130
          );

          doc.setLineWidth(
            0.2
          );

          doc.line(
            marginX,
            currentY +
              6.2,
            pageWidth -
              marginX,
            currentY +
              6.2
          );

          currentY +=
            groupHeaderHeight;
        }

        /* =================================================
           DRAW ONE LABEL
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
            50,
            50,
            50
          );

          doc.setLineWidth(
            0.2
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

          doc.setFontSize(
            8
          );

          doc.text(
            "รหัส " +
              label.code,
            x +
              cardWidth /
                2,
            y + 3,
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
              3,
            8,
            5.25
          );

          doc.text(
            label.name,
            x +
              cardWidth /
                2,
            y + 5.9,
            {
              align:
                "center",
            }
          );

          /* -----------------------------------------------
             LOT
          ----------------------------------------------- */

          doc.setFontSize(
            9
          );

          doc.text(
            "ล็อต " +
              label.lotNumber +
              "   " +
              label.copyNumber +
              "/" +
              label.copyTotal,
            x +
              cardWidth /
                2,
            y + 9.4,
            {
              align:
                "center",
            }
          );

          /* -----------------------------------------------
             DIVIDER
          ----------------------------------------------- */

          doc.setDrawColor(
            180,
            180,
            180
          );

          doc.setLineWidth(
            0.15
          );

          doc.line(
            x + 1.5,
            y + 10.5,
            x +
              cardWidth -
              1.5,
            y + 10.5
          );

          /* -----------------------------------------------
             DATE ALIGN
          ----------------------------------------------- */

          const dateLabelX =
            x + 2;

          const colonX =
            x + 14.5;

          const dateValueX =
            x + 17;

          /* -----------------------------------------------
             MANUFACTURE
          ----------------------------------------------- */

          doc.setFontSize(
            9.4
          );

          doc.text(
            "วันผลิต",
            dateLabelX,
            y + 14.9
          );

          doc.text(
            ":",
            colonX,
            y + 14.9
          );

          doc.text(
            formatThaiDate(
              label.manufacture
            ),
            dateValueX,
            y + 14.9
          );

          /* -----------------------------------------------
             EXPIRY
          ----------------------------------------------- */

          doc.setFontSize(
            9.7
          );

          doc.text(
            "วันหมดอายุ",
            dateLabelX,
            y + 19.1
          );

          doc.text(
            ":",
            colonX,
            y + 19.1
          );

          doc.text(
            formatThaiDate(
              label.expiry
            ),
            dateValueX,
            y + 19.1
          );
        }

        /* =================================================
           LOOP GROUPS

           ไม่บังคับขึ้นหน้าใหม่ทุกกลุ่ม
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

          /* ------------------------------------------------
             ต้องมีพื้นที่พออย่างน้อย:
             header + ป้าย 1 แถว

             ถ้าไม่พอค่อยขึ้นหน้าใหม่
          ------------------------------------------------ */

          const minimumHeightNeeded =
            groupHeaderHeight +
            cardHeight +
            gapY;

          if (
            currentY +
              minimumHeightNeeded >
            contentBottom
          ) {
            addNewPage();
          }

          /* ------------------------------------------------
             HEADER
          ------------------------------------------------ */

          drawGroupHeader(
            group.title,
            group.labels.length
          );

          /* ------------------------------------------------
             LABEL ROWS
          ------------------------------------------------ */

          let labelIndex =
            0;

          while (
            labelIndex <
            group.labels.length
          ) {
            /* ----------------------------------------------
               ถ้าแถวใหม่วางไม่ได้
               ให้ขึ้นหน้าใหม่

               แล้วเขียนหัวข้อซ้ำ
               เพื่อดูรู้ว่าเป็นรุ่นเดิม
            ---------------------------------------------- */

            if (
              currentY +
                cardHeight >
              contentBottom
            ) {
              addNewPage();

              drawGroupHeader(
                group.title +
                  " (ต่อ)",
                group.labels.length
              );
            }

            /* ----------------------------------------------
               วาด 1 แถว สูงสุด 5 ป้าย
            ---------------------------------------------- */

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

          /* ------------------------------------------------
             เว้นระหว่างหัวข้อเล็กน้อย
          ------------------------------------------------ */

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

        const objectUrl =
          URL.createObjectURL(
            blob
          );

        window.location.replace(
          objectUrl
        );
      } catch (error) {
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
    };
  }, [productGroups]);

  return null;
}