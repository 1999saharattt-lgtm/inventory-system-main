"use client";

import "@/lib/fonts/THSarabunNew-normal";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import jsPDF from "jspdf";

import AppButton from "@/components/AppButton";

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

   ตัวอย่าง:
   balance = 4

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
   FIT SINGLE-LINE TEXT

   ลด Font อัตโนมัติ
   เพื่อให้ชื่อรายการอยู่บรรทัดเดียว
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
  const [
    progress,
    setProgress,
  ] = useState(0);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     RANK LOTS
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
     CREATE PDF
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    async function createPdf() {
      try {
        setError("");
        setProgress(0);

        if (
          printableLabels.length ===
          0
        ) {
          setError(
            "ไม่พบหมึกพิมพ์หรือดรัมที่มีคงเหลือ"
          );

          return;
        }

        await new Promise<void>(
          (resolve) => {
            window.requestAnimationFrame(
              () => {
                resolve();
              }
            );
          }
        );

        if (
          cancelled
        ) {
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
           SMALL LABEL

           ประมาณ 38 x 22 mm
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

             บังคับ 1 บรรทัด
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

             กึ่งกลาง
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
             DATE COLUMN POSITIONS

             แยก 3 คอลัมน์:
             LABEL | : | DATE

             เพื่อให้วันที่ตรงแนวเดียวกัน
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

          /* =================================================
             PROGRESS
          ================================================= */

          if (
            !cancelled
          ) {
            const percent =
              Math.round(
                (
                  (
                    index +
                    1
                  ) /
                  printableLabels.length
                ) *
                  98
              );

            setProgress(
              percent
            );
          }
        }

        if (
          cancelled
        ) {
          return;
        }

        setProgress(
          99
        );

        const blob =
          doc.output(
            "blob"
          );

        if (
          cancelled
        ) {
          return;
        }

        const objectUrl =
          URL.createObjectURL(
            blob
          );

        setProgress(
          100
        );

        window.location.replace(
          objectUrl
        );
      } catch (err) {
        console.error(
          "ไม่สามารถสร้าง PDF ป้ายหมึกพิมพ์ได้:",
          err
        );

        if (
          !cancelled
        ) {
          setError(
            "ไม่สามารถสร้าง PDF ป้ายหมึกพิมพ์ได้ กรุณาลองใหม่อีกครั้ง"
          );
        }
      }
    }

    void createPdf();

    return () => {
      cancelled =
        true;
    };
  }, [printableLabels]);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="
        flex
        min-h-[calc(100vh-180px)]
        w-full
        min-w-0

        items-center
        justify-center

        px-4
        py-10
      "
    >
      <div
        className="
          relative

          w-full
          max-w-md

          overflow-hidden

          rounded-[30px]

          border
          border-white/80

          bg-white/80

          p-7

          text-center

          shadow-[0_24px_70px_-32px_rgba(15,23,42,0.4)]

          backdrop-blur-2xl

          sm:p-9
        "
      >
        {error ? (
          <>
            <div
              className="
                mx-auto

                grid
                h-16
                w-16

                place-items-center

                rounded-[20px]

                bg-red-50

                text-3xl

                shadow-sm

                ring-1
                ring-red-100
              "
            >
              ⚠️
            </div>

            <h1
              className="
                mt-6

                text-2xl
                font-black

                !text-slate-900
              "
            >
              สร้าง PDF ป้ายหมึกไม่สำเร็จ
            </h1>

            <p
              className="
                mt-2

                text-base
                font-semibold

                !text-slate-500
              "
            >
              {error}
            </p>

            <div
              className="
                mt-6

                flex
                justify-center
              "
            >
              <AppButton
                href="/materials"
                variant="back"
                size="md"
              >
                กลับ
              </AppButton>
            </div>
          </>
        ) : (
          <>
            <div
              className="
                mx-auto

                grid
                h-16
                w-16

                place-items-center

                rounded-[20px]

                bg-amber-50

                text-3xl

                shadow-sm

                ring-1
                ring-amber-100
              "
            >
              🏷️
            </div>

            <h1
              className="
                mt-6

                text-2xl
                font-black

                !text-slate-900
              "
            >
              กำลังสร้างป้ายหมึก
            </h1>

            <p
              className="
                mt-2

                text-base
                font-semibold

                !text-slate-500
              "
            >
              สร้างป้ายแยกตามจำนวนวัสดุที่คงเหลือจริง
            </p>

            <div
              className="
                mt-6

                h-2.5
                w-full

                overflow-hidden

                rounded-full

                bg-slate-200/80
              "
            >
              <div
                className="
                  h-full

                  rounded-full

                  bg-gradient-to-r
                  from-amber-400
                  to-yellow-500

                  transition-[width]
                  duration-200
                "
                style={{
                  width:
                    progress +
                    "%",
                }}
              />
            </div>

            <div
              className="
                mt-3

                text-sm
                font-extrabold

                !text-amber-700
              "
            >
              {progress.toLocaleString(
                "th-TH"
              )}
              %
            </div>

            <div
              className="
                mt-5

                rounded-[16px]

                border
                border-slate-200/80

                bg-slate-50/80

                px-4
                py-3

                text-sm
                font-bold

                !text-slate-500
              "
            >
              จำนวนป้ายทั้งหมด{" "}
              {printableLabels.length.toLocaleString(
                "th-TH"
              )}{" "}
              ใบ
            </div>
          </>
        )}
      </div>
    </div>
  );
}