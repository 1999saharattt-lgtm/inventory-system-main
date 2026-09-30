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

type RankedLot = LotLabel & {
  lotNumber: number;
};

type PrintableLabel =
  RankedLot & {
    copyNumber: number;
    copyTotal: number;
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

   ถ้าล็อตเดียวเหลือ 4 ชิ้น:
   ล็อต 1/4
   ล็อต 2/4
   ล็อต 3/4
   ล็อต 4/4
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
      });
    }
  }

  return labels;
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
     LOT ORDER
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
     ONE LABEL PER REMAINING UNIT
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
     CREATE + OPEN PDF IMMEDIATELY
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    let objectUrl:
      | string
      | null = null;

    function createPdf() {
      try {
        if (
          printableLabels.length ===
          0
        ) {
          document.body.innerHTML =
            '<div style="font-family:sans-serif;padding:40px;text-align:center;">ไม่พบหมึกพิมพ์หรือดรัมที่มีคงเหลือ</div>';

          return;
        }

        /* =================================================
           PDF
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
           LABEL SIZE

           ป้ายประมาณ 38 x 22 mm
           5 ป้ายต่อแถว
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
          marginTop -
          marginBottom;

        const rows =
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
          rows;

        /* =================================================
           DRAW LABELS
        ================================================= */

        for (
          let index = 0;
          index <
          printableLabels.length;
          index++
        ) {
          if (
            cancelled
          ) {
            return;
          }

          if (
            index > 0 &&
            index %
              itemsPerPage ===
              0
          ) {
            doc.addPage();
          }

          const position =
            index %
            itemsPerPage;

          const column =
            position %
            columns;

          const row =
            Math.floor(
              position /
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
            marginTop +
            row *
              (
                cardHeight +
                gapY
              );

          const label =
            printableLabels[
              index
            ];

          /* =================================================
             BORDER
          ================================================= */

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

          /* =================================================
             MATERIAL CODE
          ================================================= */

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

          /* =================================================
             MATERIAL NAME

             บรรทัดเดียว
          ================================================= */

          fitSingleLineText(
            doc,
            label.name,
            cardWidth - 3,
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

          /* =================================================
             LOT
          ================================================= */

          doc.setFontSize(
            9.5
          );

          doc.text(
            "ล็อต " +
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

          /* =================================================
             DIVIDER
          ================================================= */

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

          /* =================================================
             DATE POSITIONS

             วันผลิต      : วันที่
             วันหมดอายุ : วันที่

             : และวันที่ตรงกัน
          ================================================= */

          const dateLabelX =
            x + 2;

          const colonX =
            x + 14.5;

          const dateValueX =
            x + 17;

          /* =================================================
             MANUFACTURE DATE
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

          /* =================================================
             EXPIRY DATE
          ================================================= */

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

        objectUrl =
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
  }, [printableLabels]);

  /* =========================================================
     ไม่มีหน้า Loading

     เมื่อกดปุ่ม:
     เปิดแท็บ -> สร้าง PDF -> แสดง PDF ทันที
  ========================================================= */

  return null;
}