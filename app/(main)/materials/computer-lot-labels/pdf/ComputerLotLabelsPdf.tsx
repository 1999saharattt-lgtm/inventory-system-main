"use client";

import "@/lib/fonts/THSarabunNew-normal";

import {
  useEffect,
  useMemo,
} from "react";

import jsPDF from "jspdf";

/* =========================================================
   TYPES

   ต้องตรงกับ page.tsx ทุกช่อง
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

   ใช้เฉพาะตอนรวม Brand + Model ให้อยู่หน้าเดียวกัน
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
   GENERIC PRODUCT WORDS
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
   PRODUCT GROUP KEY

   ตัวอย่าง:

   Canon CLI-751 Black
   Canon CLI-751 Cyan
   Canon CLI-751 Yellow

   => Canon CLI-751

   ใช้แค่สำหรับรวมหน้า
   ไม่รวมล็อต
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
   COMPARE MATERIAL
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

   1. วันหมดอายุ
   2. วันผลิต
   3. วันที่รับ
   4. ReceiveItem ID
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
   BUILD REAL LOT ORDER

   1 ReceiveItem = 1 ล็อต
========================================================= */

function buildRankedLots(
  lots: LotLabel[]
): RankedLot[] {
  const grouped =
    new Map<
      number,
      LotLabel[]
    >();

  for (
    const lot of lots
  ) {
    const current =
      grouped.get(
        lot.materialId
      ) ?? [];

    current.push(
      lot
    );

    grouped.set(
      lot.materialId,
      current
    );
  }

  const materialGroups =
    Array.from(
      grouped.values()
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
    const sorted =
      [...materialLots].sort(
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
   EXPAND RECEIVE ITEM

   ตัวอย่าง:

   ReceiveItem A
   balance = 3
   ไม่มีวันที่

   =>
   ล็อต 1 1/3
   ล็อต 1 2/3
   ล็อต 1 3/3

   ReceiveItem B
   balance = 1
   มีวันที่

   =>
   ล็อต 2 1/1
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
   GROUP FOR PDF PAGE ONLY

   ไม่แก้ balance
   ไม่แก้วันที่
   ไม่รวม ReceiveItem
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

  /* -------------------------------------------------------
     ภายในรุ่นเดียวกัน

     ชื่อ/สีเดียวกันให้อยู่ใกล้กัน
     แล้วเรียงตาม FEFO
  ------------------------------------------------------- */

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

        const fefoCompare =
          compareFefo(
            a,
            b
          );

        if (
          fefoCompare !== 0
        ) {
          return fefoCompare;
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
   FIT ONE LINE
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
            '<div style="font-family:sans-serif;padding:40px;text-align:center;">ไม่พบหมึกพิมพ์ โทนเนอร์ หรือดรัมที่มีคงเหลือ</div>';

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

        const headerTop =
          6;

        const labelsTop =
          21;

        /* =================================================
           LABEL SIZE
        ================================================= */

        const marginX =
          5;

        const marginBottom =
          6;

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

        const availableHeight =
          pageHeight -
          labelsTop -
          marginBottom;

        const rowsPerPage =
          Math.floor(
            (
              availableHeight +
              gapY
            ) /
            (
              cardHeight +
              gapY
            )
          );

        const itemsPerPage =
          columns *
          rowsPerPage;

        let firstPage =
          true;

        /* =================================================
           PRODUCT MODEL
        ================================================= */

        for (
          const productGroup of
          productGroups
        ) {
          if (
            cancelled
          ) {
            return;
          }

          if (
            !firstPage
          ) {
            doc.addPage();
          }

          firstPage =
            false;

          const totalPages =
            Math.ceil(
              productGroup.labels
                .length /
                itemsPerPage
            );

          let currentPage =
            1;

          /* =================================================
             SAME MODEL PAGES
          ================================================= */

          for (
            let startIndex = 0;
            startIndex <
            productGroup.labels
              .length;
            startIndex +=
              itemsPerPage
          ) {
            if (
              startIndex > 0
            ) {
              doc.addPage();

              currentPage +=
                1;
            }

            const pageLabels =
              productGroup.labels.slice(
                startIndex,
                startIndex +
                  itemsPerPage
              );

            /* =================================================
               HEADER
            ================================================= */

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
              productGroup.title,
              pageWidth -
                24,
              17,
              11
            );

            doc.text(
              productGroup.title,
              pageWidth / 2,
              headerTop +
                5,
              {
                align:
                  "center",
              }
            );

            doc.setFontSize(
              9
            );

            doc.text(
              "จำนวนป้าย " +
                productGroup.labels.length.toLocaleString(
                  "th-TH"
                ) +
                " ใบ",
              7,
              headerTop +
                10
            );

            if (
              totalPages >
              1
            ) {
              doc.text(
                "หน้า " +
                  currentPage +
                  "/" +
                  totalPages,
                pageWidth -
                  7,
                headerTop +
                  10,
                {
                  align:
                    "right",
                }
              );
            }

            doc.setDrawColor(
              130,
              130,
              130
            );

            doc.setLineWidth(
              0.2
            );

            doc.line(
              6,
              headerTop +
                12,
              pageWidth -
                6,
              headerTop +
                12
            );

            /* =================================================
               LABEL
            ================================================= */

            for (
              let index = 0;
              index <
              pageLabels.length;
              index++
            ) {
              const label =
                pageLabels[
                  index
                ];

              const column =
                index %
                columns;

              const row =
                Math.floor(
                  index /
                    columns
                );

              const x =
                marginX +
                column *
                  (
                    cardWidth +
                    gapX
                  );

              const y =
                labelsTop +
                row *
                  (
                    cardHeight +
                    gapY
                  );

              /* ===============================================
                 BORDER
              =============================================== */

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

              /* ===============================================
                 CODE
              =============================================== */

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

              /* ===============================================
                 NAME
              =============================================== */

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

              /* ===============================================
                 LOT

                 ตัวอย่าง:
                 ล็อต 1 1/3
                 ล็อต 1 2/3
                 ล็อต 1 3/3

                 รับใหม่:
                 ล็อต 2 1/1
              =============================================== */

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

              /* ===============================================
                 LINE
              =============================================== */

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

              /* ===============================================
                 DATE ALIGNMENT
              =============================================== */

              const dateLabelX =
                x + 2;

              const colonX =
                x + 14.5;

              const dateValueX =
                x + 17;

              /* ===============================================
                 MANUFACTURE

                 ใช้วันที่ของ ReceiveItem นี้เท่านั้น
              =============================================== */

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

              /* ===============================================
                 EXPIRY

                 ใช้วันที่ของ ReceiveItem นี้เท่านั้น
              =============================================== */

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
          }
        }

        if (
          cancelled
        ) {
          return;
        }

        /* =================================================
           OPEN PDF DIRECTLY
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