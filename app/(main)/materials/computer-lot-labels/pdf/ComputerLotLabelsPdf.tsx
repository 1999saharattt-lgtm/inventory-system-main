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
  id: number;
  materialId: number;

  code: string;
  name: string;
  unit: string;

  balance: number;

  manufacture: string | null;
  expiry: string | null;
  receiveDate: string | null;
};

type RankedLot =
  LotLabel & {
    lotNumber: number;
  };

type PrintableLabel =
  RankedLot & {
    copyNumber: number;
    copyTotal: number;

    groupKey: string;
    groupTitle: string;
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
   COLORS

   ใช้ตัดชื่อสีออกจากชื่อสินค้า
   เพื่อให้รุ่นเดียวกันรวมเป็นกลุ่มเดียวกัน

   HP 206A Black
   HP 206A Cyan
   HP 206A Yellow

   => HP 206A
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
  "c",
  "m",
  "y",

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

   ตัดคำทั่วไปออกสำหรับสร้าง Group Key
   เพื่อเหลือ Brand + Model
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
      /[-]+/g,
      "-"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

/* =========================================================
   REMOVE WORD

   ลบเฉพาะคำที่เป็น token
========================================================= */

function removeWord(
  text: string,
  word: string
): string {
  const escaped =
    word.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
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

   เป้าหมาย:
   เน้น Brand + Model

   ตัวอย่าง:

   หมึกพิมพ์ HP 206A Black
   หมึกพิมพ์ HP 206A Cyan
   หมึกพิมพ์ HP 206A Magenta

   => hp 206a
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
   GROUP TITLE

   ใช้แสดงด้านบนของหน้า PDF
   ตัดสีออก แต่ยังอ่านง่าย
========================================================= */

function getProductGroupTitle(
  name: string
): string {
  let result =
    cleanText(name);

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
   MATERIAL CODE SORT
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
   FEFO SORT

   1. วันหมดอายุเร็วที่สุด
   2. วันผลิตเก่าที่สุด
   3. วันที่รับเข้าเก่าที่สุด
   4. ReceiveItem.id
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
    a.id -
    b.id
  );
}

/* =========================================================
   BUILD LOT ORDER

   เรียงล็อตแยกตาม materialId
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

  const groups =
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

   1 ชิ้นคงเหลือ = 1 ป้าย
========================================================= */

function expandPrintableLabels(
  rankedLots: RankedLot[]
): PrintableLabel[] {
  const labels:
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

    const groupKey =
      getProductGroupKey(
        lot.name
      );

    const groupTitle =
      getProductGroupTitle(
        lot.name
      );

    for (
      let copy = 1;
      copy <= quantity;
      copy++
    ) {
      labels.push({
        ...lot,

        copyNumber:
          copy,

        copyTotal:
          quantity,

        groupKey,

        groupTitle,
      });
    }
  }

  return labels;
}

/* =========================================================
   GROUP BY BRAND + MODEL

   ทุกสีของรุ่นเดียวกัน
   จะอยู่ใน ProductGroup เดียวกัน
========================================================= */

function buildProductGroups(
  labels: PrintableLabel[]
): ProductGroup[] {
  const groupMap =
    new Map<
      string,
      ProductGroup
    >();

  for (
    const label of
    labels
  ) {
    const current =
      groupMap.get(
        label.groupKey
      );

    if (current) {
      current.labels.push(
        label
      );

      continue;
    }

    groupMap.set(
      label.groupKey,
      {
        key:
          label.groupKey,

        title:
          label.groupTitle,

        labels: [
          label,
        ],
      }
    );
  }

  const groups =
    Array.from(
      groupMap.values()
    );

  /* -------------------------------------------------------
     เรียงกลุ่มตามชื่อรุ่น
  ------------------------------------------------------- */

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
     ภายในแต่ละรุ่น:
     FEFO ก่อน
     แล้วชื่อสินค้า/สี
  ------------------------------------------------------- */

  for (
    const group of
    groups
  ) {
    group.labels.sort(
      (a, b) => {
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

        const name =
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
          name !== 0
        ) {
          return name;
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
   FIT SINGLE LINE TEXT
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
     FEFO
  ======================================================= */

  const rankedLots =
    useMemo(
      () =>
        buildRankedLots(
          lots
        ),
      [lots]
    );

  /* =======================================================
     ONE LABEL PER UNIT
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
     BRAND + MODEL GROUPS
  ======================================================= */

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
            '<div style="font-family:sans-serif;padding:40px;text-align:center;">ไม่พบหมึกพิมพ์ โทนเนอร์ หรือตลับดรัมที่มีคงเหลือ</div>';

          return;
        }

        /* =================================================
           A4 PORTRAIT
        ================================================= */

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

        /* -------------------------------------------------
           HEADER
        ------------------------------------------------- */

        const headerTop =
          7;

        const labelsTop =
          22;

        /* -------------------------------------------------
           LABEL

           เล็กตามที่ปรับก่อนหน้า
           5 ป้ายต่อแถว
        ------------------------------------------------- */

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
           EACH BRAND + MODEL
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

          /* -------------------------------------------------
             แต่ละรุ่นเริ่มหน้าใหม่เสมอ
          ------------------------------------------------- */

          if (
            !firstPage
          ) {
            doc.addPage();
          }

          firstPage =
            false;

          let pageInGroup =
            1;

          const totalPagesInGroup =
            Math.ceil(
              group.labels.length /
                itemsPerPage
            );

          /* =================================================
             GROUP PAGES

             ถ้ารุ่นเดียวมีจำนวนมากเกิน 1 หน้า
             หน้าที่ 2 ยังเป็นรุ่นเดิม
          ================================================= */

          for (
            let start = 0;
            start <
            group.labels.length;
            start +=
              itemsPerPage
          ) {
            if (
              start > 0
            ) {
              doc.addPage();

              pageInGroup +=
                1;
            }

            const pageLabels =
              group.labels.slice(
                start,
                start +
                  itemsPerPage
              );

            /* =================================================
               PAGE HEADER
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

            doc.setFontSize(
              17
            );

            fitSingleLineText(
              doc,
              group.title,
              pageWidth -
                24,
              17,
              11
            );

            doc.text(
              group.title,
              pageWidth / 2,
              headerTop +
                5,
              {
                align:
                  "center",
              }
            );

            /* -------------------------------------------------
               จำนวนป้าย
            ------------------------------------------------- */

            doc.setFontSize(
              9
            );

            doc.text(
              "จำนวน " +
                group.labels.length.toLocaleString(
                  "th-TH"
                ) +
                " ป้าย",
              7,
              headerTop +
                10
            );

            /* -------------------------------------------------
               PAGE NUMBER

               แสดงเฉพาะกรณีรุ่นเดียวเกินหนึ่งหน้า
            ------------------------------------------------- */

            if (
              totalPagesInGroup >
              1
            ) {
              doc.text(
                "หน้า " +
                  pageInGroup +
                  "/" +
                  totalPagesInGroup,
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
               DRAW LABELS
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
                60,
                60,
                60
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
                 MATERIAL CODE
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
                 FULL PRODUCT NAME

                 เก็บชื่อสีไว้
                 เพราะแต่ละป้ายต้องรู้ว่าเป็นสีอะไร

                 บังคับ 1 บรรทัด
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
                 ล็อต 1  1/4

                 หมายถึง:
                 ล็อต FEFO ลำดับ 1
                 ชิ้นที่ 1 จาก 4 ชิ้นในล็อตนั้น
              =============================================== */

              doc.setFontSize(
                9.2
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
                y + 9.5,
                {
                  align:
                    "center",
                }
              );

              /* ===============================================
                 DIVIDER
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
                y + 10.6,
                x +
                  cardWidth -
                  1.5,
                y + 10.6
              );

              /* ===============================================
                 DATE COLUMNS
              =============================================== */

              const dateLabelX =
                x + 2;

              const colonX =
                x + 14.5;

              const dateValueX =
                x + 17;

              /* ===============================================
                 MANUFACTURE
              =============================================== */

              doc.setTextColor(
                0,
                0,
                0
              );

              doc.setFontSize(
                9.4
              );

              doc.text(
                "วันผลิต",
                dateLabelX,
                y + 15
              );

              doc.text(
                ":",
                colonX,
                y + 15
              );

              doc.text(
                formatThaiDate(
                  label.manufacture
                ),
                dateValueX,
                y + 15
              );

              /* ===============================================
                 EXPIRY
              =============================================== */

              doc.setFontSize(
                9.7
              );

              doc.text(
                "วันหมดอายุ",
                dateLabelX,
                y + 19.2
              );

              doc.text(
                ":",
                colonX,
                y + 19.2
              );

              doc.text(
                formatThaiDate(
                  label.expiry
                ),
                dateValueX,
                y + 19.2
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

  /* =========================================================
     ไม่แสดงหน้า Loading
  ========================================================= */

  return null;
}