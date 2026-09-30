```tsx
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

/* =========================================================
   PROPS
========================================================= */

type Props = {
  lots: LotLabel[];
};

/* =========================================================
   THAI DATE
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
   DATE VALUE FOR SORT

   null = Infinity
   หมายความว่า:
   ล็อตที่ไม่มีวันหมดอายุ
   จะอยู่หลังล็อตที่มีวันหมดอายุ
========================================================= */

function dateValue(
  value: string | null
) {
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

   ตัวอย่าง:
   01 ก.ย. 2569
========================================================= */

function formatThaiDate(
  value: string | null
) {
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

  return `${day} ${month} ${year}`;
}

/* =========================================================
   MATERIAL CODE SORT
========================================================= */

function compareMaterialCode(
  a: LotLabel,
  b: LotLabel
) {
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

   ภายในพัสดุรายการเดียวกัน:

   1. วันหมดอายุเร็วที่สุดก่อน
   2. วันผลิตเก่าที่สุดก่อน
   3. วันที่รับเข้าเก่าที่สุดก่อน
   4. ReceiveItem.id น้อยที่สุดก่อน

   ล็อตที่ไม่มีวันหมดอายุ:
   - อยู่หลังล็อตที่มีวันหมดอายุ
   - แล้วเรียงตามวันผลิต
========================================================= */

function compareFefo(
  a: LotLabel,
  b: LotLabel
) {
  /* -------------------------------------------------------
     EXPIRY
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     MANUFACTURE
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     RECEIVE DATE
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     RECEIVE ITEM ID
  ------------------------------------------------------- */

  return (
    a.id -
    b.id
  );
}

/* =========================================================
   BUILD LOT NUMBER

   สำคัญ:
   เลขล็อตนี้เป็น "ลำดับการเบิก"

   ตัวอย่าง:
   รหัส 401-001

   LOT 1 = ต้องเบิกก่อน
   LOT 2 = เบิกถัดไป
   LOT 3 = เบิกถัดไป

   คำนวณใหม่จาก FEFO ทุกครั้งที่เปิด PDF
========================================================= */

function buildRankedLots(
  lots: LotLabel[]
): RankedLot[] {
  /* -------------------------------------------------------
     GROUP BY MATERIAL
  ------------------------------------------------------- */

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

    current.push(lot);

    grouped.set(
      lot.materialId,
      current
    );
  }

  /* -------------------------------------------------------
     SORT MATERIAL GROUPS
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     FEFO EACH MATERIAL
  ------------------------------------------------------- */

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
     FEFO LOTS
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
     CREATE PDF
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    let createdObjectUrl:
      | string
      | null = null;

    async function createPdf() {
      try {
        setError("");
        setProgress(0);

        /* =================================================
           EMPTY
        ================================================= */

        if (
          rankedLots.length ===
          0
        ) {
          setError(
            "ไม่พบล็อตวัสดุคอมพิวเตอร์ที่มีคงเหลือ"
          );

          return;
        }

        /* =================================================
           ให้ Loading UI แสดงก่อนเริ่มสร้าง PDF
        ================================================= */

        await new Promise<void>(
          (resolve) => {
            window.requestAnimationFrame(
              () =>
                resolve()
            );
          }
        );

        if (cancelled) {
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
           PAGE CONFIG

           A4
           3 columns

           ป้ายกว้างประมาณ 61 มม.
           สูงประมาณ 40 มม.

           เหมาะสำหรับตัดแปะกล่องหมึก
        ================================================= */

        const pageWidth =
          210;

        const pageHeight =
          297;

        const marginX =
          8;

        const marginTop =
          10;

        const marginBottom =
          10;

        const columns =
          3;

        const gapX =
          3;

        const gapY =
          3;

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
          40;

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
           DRAW
        ================================================= */

        for (
          let index = 0;
          index <
          rankedLots.length;
          index++
        ) {
          if (cancelled) {
            return;
          }

          /* -------------------------------------------------
             PAGE
          ------------------------------------------------- */

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

          const lot =
            rankedLots[
              index
            ];

          /* =================================================
             CARD BORDER
          ================================================= */

          doc.setDrawColor(
            0,
            0,
            0
          );

          doc.setLineWidth(
            0.35
          );

          doc.rect(
            x,
            y,
            cardWidth,
            cardHeight
          );

          /* =================================================
             HEADER BACKGROUND

             ใช้สีเทาอ่อนเพื่อพิมพ์ได้ชัด
             และไม่เปลืองหมึกมาก
          ================================================= */

          doc.setFillColor(
            235,
            238,
            242
          );

          doc.rect(
            x,
            y,
            cardWidth,
            17,
            "F"
          );

          /* =================================================
             MATERIAL CODE
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
            13
          );

          doc.text(
            `รหัสพัสดุ ${lot.code}`,
            x + 3,
            y + 5.5
          );

          /* =================================================
             MATERIAL NAME
          ================================================= */

          doc.setFontSize(
            11
          );

          const nameLines =
            doc.splitTextToSize(
              lot.name,
              cardWidth -
                6
            );

          doc.text(
            nameLines.slice(
              0,
              1
            ),
            x + 3,
            y + 10.8
          );

          /* =================================================
             LOT NUMBER / ISSUE PRIORITY
          ================================================= */

          doc.setFontSize(
            13
          );

          doc.text(
            `ล็อต ${lot.lotNumber}`,
            x + 3,
            y + 16
          );

          /* =================================================
             PRIORITY BADGE

             ล็อต 1 = เบิกก่อน
          ================================================= */

          if (
            lot.lotNumber ===
            1
          ) {
            const badgeWidth =
              21;

            const badgeX =
              x +
              cardWidth -
              badgeWidth -
              2;

            doc.setFillColor(
              255,
              235,
              150
            );

            doc.roundedRect(
              badgeX,
              y + 11.3,
              badgeWidth,
              4.5,
              1,
              1,
              "F"
            );

            doc.setFontSize(
              9
            );

            doc.text(
              "เบิกก่อน",
              badgeX +
                badgeWidth /
                  2,
              y + 14.4,
              {
                align:
                  "center",
              }
            );
          }

          /* =================================================
             DIVIDER
          ================================================= */

          doc.setDrawColor(
            120,
            120,
            120
          );

          doc.setLineWidth(
            0.2
          );

          doc.line(
            x,
            y + 17,
            x +
              cardWidth,
            y + 17
          );

          /* =================================================
             MANUFACTURE
          ================================================= */

          doc.setFontSize(
            11
          );

          doc.text(
            "วันผลิต",
            x + 3,
            y + 23
          );

          doc.text(
            formatThaiDate(
              lot.manufacture
            ),
            x + 23,
            y + 23
          );

          /* =================================================
             EXPIRY
          ================================================= */

          doc.text(
            "วันหมดอายุ",
            x + 3,
            y + 28.8
          );

          doc.text(
            formatThaiDate(
              lot.expiry
            ),
            x + 23,
            y + 28.8
          );

          /* =================================================
             BALANCE
          ================================================= */

          doc.text(
            "คงเหลือ",
            x + 3,
            y + 34.6
          );

          doc.text(
            `${lot.balance.toLocaleString(
              "th-TH"
            )} ${lot.unit}`,
            x + 23,
            y + 34.6
          );

          /* =================================================
             LOT REFERENCE

             เลขเล็กด้านล่างเพื่อใช้ตรวจสอบฐานข้อมูล
             ไม่ใช่ลำดับการเบิก
          ================================================= */

          doc.setFontSize(
            7.5
          );

          doc.setTextColor(
            100,
            100,
            100
          );

          doc.text(
            `REF ${lot.id}`,
            x +
              cardWidth -
              2,
            y +
              cardHeight -
              2,
            {
              align:
                "right",
            }
          );

          /* =================================================
             PROGRESS
          ================================================= */

          if (!cancelled) {
            setProgress(
              Math.round(
                (
                  (
                    index +
                    1
                  ) /
                  rankedLots.length
                ) *
                  98
              )
            );
          }
        }

        if (cancelled) {
          return;
        }

        /* =================================================
           PDF BLOB
        ================================================= */

        setProgress(99);

        const blob =
          doc.output(
            "blob"
          );

        if (cancelled) {
          return;
        }

        createdObjectUrl =
          URL.createObjectURL(
            blob
          );

        setProgress(100);

        /* =================================================
           OPEN PDF
        ================================================= */

        window.location.replace(
          createdObjectUrl
        );
      } catch (err) {
        console.error(
          "ไม่สามารถสร้าง PDF ป้ายล็อตวัสดุคอมพิวเตอร์ได้:",
          err
        );

        if (
          !cancelled
        ) {
          setError(
            "ไม่สามารถสร้าง PDF ป้ายล็อตวัสดุคอมพิวเตอร์ได้ กรุณาลองใหม่อีกครั้ง"
          );
        }
      }
    }

    void createPdf();

    /* =====================================================
       CLEANUP
    ===================================================== */

    return () => {
      cancelled =
        true;

      /*
       * ไม่ revoke Object URL ทันที
       * เพราะ Browser อาจกำลังเปิด PDF อยู่
       */
    };
  }, [rankedLots]);

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
        {/* ===================================================
            AMBIENT GLOW
        =================================================== */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            -right-16
            -top-16

            h-40
            w-40

            rounded-full

            bg-amber-200/40

            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            -bottom-16
            -left-16

            h-40
            w-40

            rounded-full

            bg-emerald-200/30

            blur-3xl
          "
        />

        {/* ===================================================
            ERROR
        =================================================== */}

        {error ? (
          <>
            <div
              className="
                relative
                z-10

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
                relative
                z-10

                mt-6

                text-2xl
                font-black
                tracking-tight

                !text-slate-900
              "
            >
              สร้าง PDF ป้ายล็อตไม่สำเร็จ
            </h1>

            <p
              className="
                relative
                z-10

                mt-2

                text-base
                font-semibold
                leading-relaxed

                !text-slate-500
              "
            >
              {error}
            </p>

            <div
              className="
                relative
                z-10

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
            {/* =================================================
                ICON
            ================================================= */}

            <div
              className="
                relative
                z-10

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

            {/* =================================================
                TITLE
            ================================================= */}

            <h1
              className="
                relative
                z-10

                mt-6

                text-2xl
                font-black
                tracking-tight

                !text-slate-900
              "
            >
              กำลังสร้างป้ายล็อตหมึก
            </h1>

            <p
              className="
                relative
                z-10

                mt-2

                text-base
                font-semibold
                leading-relaxed

                !text-slate-500
              "
            >
              เรียงลำดับล็อตตามหลัก FEFO
              เพื่อให้ล็อตที่หมดอายุก่อนถูกเบิกก่อน
            </p>

            {/* =================================================
                PROGRESS
            ================================================= */}

            <div
              className="
                relative
                z-10

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
                  ease-out
                "
                style={{
                  width:
                    `${progress}%`,
                }}
              />
            </div>

            {/* =================================================
                PERCENT
            ================================================= */}

            <div
              className="
                relative
                z-10

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

            {/* =================================================
                COUNT
            ================================================= */}

            <div
              className="
                relative
                z-10

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

                shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]

                backdrop-blur-xl
              "
            >
              พบล็อตวัสดุคอมพิวเตอร์คงเหลือ{" "}
              {rankedLots.length.toLocaleString(
                "th-TH"
              )}{" "}
              ล็อต
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```