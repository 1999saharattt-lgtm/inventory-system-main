"use client";

import "@/lib/fonts/THSarabunNew-normal";

import {
  useEffect,
  useState,
} from "react";

import QRCode from "qrcode";
import jsPDF from "jspdf";

import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type Material = {
  id: number;
  code: string;
  name: string;
  category: string;
};

type Props = {
  materials: Material[];
};

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<
  string,
  string
> = {
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

const categoryOrder = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

/* =========================================================
   PERFORMANCE CONFIG

   เดิม
   - QR 300px
   - Error Correction H
   - สร้าง QR ทีละหน้า
   - PDF compress = true

   ใหม่
   - QR 180px
   - Error Correction M
   - สร้าง QR ทั้งหมดพร้อมกัน
   - Cache QR
   - ไม่ compress PDF ระหว่างสร้าง

   จุดประสงค์:
   เปิด PDF ให้เร็วที่สุด
========================================================= */

const QR_SIZE_PX = 180;

const QR_OPTIONS = {
  width:
    QR_SIZE_PX,

  margin:
    1,

  errorCorrectionLevel:
    "M" as const,
};

/* =========================================================
   QR CACHE

   เก็บ QR ที่เคยสร้างแล้วไว้ในหน่วยความจำ

   ถ้า React Component ถูกเรียกใหม่
   แต่ Browser ยังอยู่ใน session เดิม
   จะไม่ต้องสร้าง QR เดิมซ้ำ
========================================================= */

const qrDataUrlCache =
  new Map<
    string,
    string
  >();

/* =========================================================
   NATURAL SORT
========================================================= */

function compareMaterialCode(
  a: Material,
  b: Material
) {
  const aNumberText =
    a.code.replace(
      /\D/g,
      ""
    );

  const bNumberText =
    b.code.replace(
      /\D/g,
      ""
    );

  const aCode =
    aNumberText
      ? Number(
          aNumberText
        )
      : Number.NaN;

  const bCode =
    bNumberText
      ? Number(
          bNumberText
        )
      : Number.NaN;

  /* =======================================================
     NUMERIC CODE

     1
     2
     9
     10
     110
     111
  ======================================================= */

  if (
    !Number.isNaN(
      aCode
    ) &&
    !Number.isNaN(
      bCode
    )
  ) {
    if (
      aCode !== bCode
    ) {
      return (
        aCode -
        bCode
      );
    }

    return (
      a.id -
      b.id
    );
  }

  /* =======================================================
     NATURAL SORT FALLBACK
  ======================================================= */

  const codeCompare =
    a.code.localeCompare(
      b.code,
      "th",
      {
        numeric:
          true,

        sensitivity:
          "base",
      }
    );

  if (
    codeCompare !== 0
  ) {
    return codeCompare;
  }

  return (
    a.id -
    b.id
  );
}

/* =========================================================
   GET QR

   มี Cache
   -> ใช้ของเดิมทันที

   ไม่มี Cache
   -> สร้างใหม่
========================================================= */

async function getQRCode(
  url: string
) {
  const cached =
    qrDataUrlCache.get(
      url
    );

  if (cached) {
    return cached;
  }

  const qrDataUrl =
    await QRCode.toDataURL(
      url,
      QR_OPTIONS
    );

  qrDataUrlCache.set(
    url,
    qrDataUrl
  );

  return qrDataUrl;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function QRCodePdf({
  materials,
}: Props) {
  const [
    error,
    setError,
  ] = useState("");

  const [
    progress,
    setProgress,
  ] = useState(0);

  /* =======================================================
     CREATE PDF
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    let createdObjectUrl:
      | string
      | null = null;

    /* =====================================================
       CREATE
    ===================================================== */

    async function createPdf() {
      try {
        setError("");
        setProgress(0);

        /* ===================================================
           VALIDATE
        =================================================== */

        if (
          !materials ||
          materials.length ===
            0
        ) {
          setError(
            "ยังไม่มีรายการพัสดุสำหรับสร้าง QR Code"
          );

          return;
        }

        /* ===================================================
           ให้ Browser แสดง Loading UI ก่อนเริ่มงานหนัก
        =================================================== */

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

        /* ===================================================
           SORT MATERIALS

           เรียงหมวดก่อน
           แล้วเรียงรหัสภายในหมวด
        =================================================== */

        const categoryIndex =
          new Map<
            string,
            number
          >(
            categoryOrder.map(
              (
                category,
                index
              ) => [
                category,
                index,
              ]
            )
          );

        const sortedMaterials =
          [...materials].sort(
            (a, b) => {
              const categoryA =
                categoryIndex.get(
                  a.category
                ) ??
                Number.MAX_SAFE_INTEGER;

              const categoryB =
                categoryIndex.get(
                  b.category
                ) ??
                Number.MAX_SAFE_INTEGER;

              if (
                categoryA !==
                categoryB
              ) {
                return (
                  categoryA -
                  categoryB
                );
              }

              return compareMaterialCode(
                a,
                b
              );
            }
          );

        /* ===================================================
           GROUP MATERIALS

           ทำครั้งเดียว
           ไม่ filter array ซ้ำหลายรอบ
        =================================================== */

        const groupedMap =
          new Map<
            string,
            Material[]
          >();

        for (
          const category of
          categoryOrder
        ) {
          groupedMap.set(
            category,
            []
          );
        }

        for (
          const material of
          sortedMaterials
        ) {
          const group =
            groupedMap.get(
              material.category
            );

          if (group) {
            group.push(
              material
            );
          }
        }

        const groupedMaterials =
          categoryOrder
            .map(
              (
                category
              ) => ({
                category,

                materials:
                  groupedMap.get(
                    category
                  ) ?? [],
              })
            )
            .filter(
              (group) =>
                group
                  .materials
                  .length >
                0
            );

        /* ===================================================
           GENERATE ALL QR CODES FIRST

           สำคัญ:
           เดิมสร้างทีละหน้า 16 QR
           ทำให้ต้องรอเป็นรอบ ๆ

           ใหม่:
           ส่งงาน QR ทั้งหมดพร้อมกัน
        =================================================== */

        const total =
          sortedMaterials.length;

        let completed = 0;

        const qrEntries =
          await Promise.all(
            sortedMaterials.map(
              async (
                material
              ) => {
                const materialUrl =
                  new URL(
                    `/stock-card/material/${material.id}/pdf`,
                    window
                      .location
                      .origin
                  ).toString();

                const qrDataUrl =
                  await getQRCode(
                    materialUrl
                  );

                completed +=
                  1;

                if (
                  !cancelled
                ) {
                  setProgress(
                    Math.round(
                      (completed /
                        total) *
                        80
                    )
                  );
                }

                return [
                  material.id,
                  qrDataUrl,
                ] as const;
              }
            )
          );

        if (cancelled) {
          return;
        }

        /* ===================================================
           QR MAP

           material.id -> QR image
        =================================================== */

        const qrMap =
          new Map<
            number,
            string
          >(
            qrEntries
          );

        setProgress(82);

        /* ===================================================
           PDF CONFIGURATION

           compress: false

           การเปิด compress ระหว่างสร้าง
           ทำให้ CPU ต้องบีบ PDF อีกครั้ง
           ซึ่งไม่จำเป็นสำหรับการเปิดดูทันที
        =================================================== */

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

        /* ===================================================
           PAGE CONFIG
        =================================================== */

        const pageWidth =
          210;

        const marginX =
          10;

        const marginY =
          10;

        const columns =
          4;

        const gapX =
          3;

        const gapY =
          5;

        const cardWidth =
          (pageWidth -
            marginX * 2 -
            gapX *
              (columns -
                1)) /
          columns;

        const cardHeight =
          58;

        const itemsPerPage =
          16;

        const qrSize =
          35;

        let isFirstPage =
          true;

        let renderedItems =
          0;

        /* ===================================================
           CREATE PDF
        =================================================== */

        for (
          const group of
          groupedMaterials
        ) {
          if (cancelled) {
            return;
          }

          const category =
            categoryName[
              group.category
            ] ??
            group.category;

          const categoryMaterials =
            group.materials;

          let itemIndex =
            0;

          /* =================================================
             16 ITEMS / PAGE
             4 COLUMNS x 4 ROWS
          ================================================= */

          while (
            itemIndex <
            categoryMaterials.length
          ) {
            if (
              cancelled
            ) {
              return;
            }

            /* ===============================================
               ADD PAGE
            =============================================== */

            if (
              !isFirstPage
            ) {
              doc.addPage();
            }

            isFirstPage =
              false;

            /* ===============================================
               CATEGORY TITLE
            =============================================== */

            doc.setFont(
              "2.3.2 THSarabunNew",
              "normal"
            );

            doc.setFontSize(
              18
            );

            doc.text(
              category,
              pageWidth / 2,
              7,
              {
                align:
                  "center",
              }
            );

            /* ===============================================
               CURRENT PAGE
            =============================================== */

            const pageMaterials =
              categoryMaterials.slice(
                itemIndex,
                itemIndex +
                  itemsPerPage
              );

            /* ===============================================
               DRAW CARDS

               QR ถูกสร้างไว้ครบแล้ว
               ตรงนี้จึงไม่ await QR อีก
            =============================================== */

            for (
              let position =
                0;
              position <
              pageMaterials.length;
              position++
            ) {
              const material =
                pageMaterials[
                  position
                ];

              const qrDataUrl =
                qrMap.get(
                  material.id
                );

              if (
                !qrDataUrl
              ) {
                continue;
              }

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
                  (cardWidth +
                    gapX);

              const y =
                marginY +
                5 +
                row *
                  (cardHeight +
                    gapY);

              /* =============================================
                 CARD BORDER
              ============================================= */

              doc.setDrawColor(
                0,
                0,
                0
              );

              doc.setLineWidth(
                0.3
              );

              doc.rect(
                x,
                y,
                cardWidth,
                cardHeight
              );

              /* =============================================
                 QR CODE
              ============================================= */

              const qrX =
                x +
                (cardWidth -
                  qrSize) /
                  2;

              const qrY =
                y + 3;

              doc.addImage(
                qrDataUrl,
                "PNG",
                qrX,
                qrY,
                qrSize,
                qrSize,
                undefined,
                "FAST"
              );

              /* =============================================
                 MATERIAL CODE
              ============================================= */

              doc.setFont(
                "2.3.2 THSarabunNew",
                "normal"
              );

              doc.setFontSize(
                11
              );

              doc.text(
                `รหัสพัสดุ : ${
                  material.code ||
                  "-"
                }`,
                x +
                  cardWidth /
                    2,
                y + 42,
                {
                  align:
                    "center",
                }
              );

              /* =============================================
                 MATERIAL NAME
              ============================================= */

              doc.setFontSize(
                9
              );

              const name =
                material.name ||
                "-";

              const maxWidth =
                cardWidth -
                4;

              const lines =
                doc.splitTextToSize(
                  name,
                  maxWidth
                );

              doc.text(
                lines.slice(
                  0,
                  2
                ),
                x +
                  cardWidth /
                    2,
                y + 48,
                {
                  align:
                    "center",
                }
              );

              renderedItems +=
                1;
            }

            itemIndex +=
              itemsPerPage;

            /* ===============================================
               PDF DRAW PROGRESS

               QR = 0 - 80%
               PDF = 80 - 98%
            =============================================== */

            if (
              !cancelled
            ) {
              const pdfProgress =
                total > 0
                  ? Math.round(
                      (renderedItems /
                        total) *
                        18
                    )
                  : 0;

              setProgress(
                Math.min(
                  98,
                  80 +
                    pdfProgress
                )
              );
            }
          }
        }

        /* ===================================================
           CANCEL CHECK
        =================================================== */

        if (cancelled) {
          return;
        }

        setProgress(99);

        /* ===================================================
           CREATE PDF BLOB

           ไม่มี compression
           จึงออก Blob ได้เร็วกว่าเดิม
        =================================================== */

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

        /* ===================================================
           OPEN PDF
        =================================================== */

        window.location.replace(
          createdObjectUrl
        );
      } catch (err) {
        console.error(
          "ไม่สามารถสร้าง QR Code PDF ได้:",
          err
        );

        if (
          !cancelled
        ) {
          setError(
            "ไม่สามารถสร้าง QR Code PDF ได้ กรุณาลองใหม่อีกครั้ง"
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
       * เพราะ browser อาจกำลังเปิด PDF อยู่
       *
       * เมื่อเปลี่ยนไป blob URL
       * document เดิมจะถูก unload อยู่แล้ว
       */
    };
  }, [materials]);

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

            bg-emerald-400/10

            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-20
            -left-16

            h-44
            w-44

            rounded-full

            bg-green-400/10

            blur-3xl
          "
        />

        {/* ===================================================
            TOP HIGHLIGHT
        =================================================== */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute

            inset-x-8
            top-0

            h-px

            bg-gradient-to-r
            from-transparent
            via-white
            to-transparent

            opacity-90
          "
        />

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div
          className="
            relative
          "
        >
          {error ? (
            <>
              {/* ===============================================
                  ERROR ICON
              =============================================== */}

              <div
                className="
                  mx-auto

                  flex
                  h-20
                  w-20

                  items-center
                  justify-center

                  rounded-[24px]

                  border
                  border-red-100

                  bg-red-50/90

                  text-4xl

                  shadow-[0_14px_30px_-20px_rgba(239,68,68,0.5)]

                  backdrop-blur-xl
                "
              >
                ⚠️
              </div>

              {/* ===============================================
                  ERROR TITLE
              =============================================== */}

              <h1
                className="
                  mt-6

                  text-2xl
                  font-black
                  tracking-tight

                  !text-slate-900
                "
              >
                สร้าง QR Code PDF
                ไม่สำเร็จ
              </h1>

              <p
                className="
                  mt-2

                  text-base
                  font-semibold
                  leading-relaxed

                  !text-slate-500
                "
              >
                {error}
              </p>

              {/* ===============================================
                  BACK
              =============================================== */}

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
              {/* ===============================================
                  QR ICON
              =============================================== */}

              <div
                className="
                  mx-auto

                  flex
                  h-20
                  w-20

                  items-center
                  justify-center

                  rounded-[24px]

                  bg-gradient-to-br
                  from-emerald-500
                  via-emerald-600
                  to-green-700

                  text-4xl

                  shadow-[0_18px_38px_-20px_rgba(5,150,105,0.55)]

                  ring-1
                  ring-white/30
                "
              >
                📱
              </div>

              {/* ===============================================
                  TITLE
              =============================================== */}

              <h1
                className="
                  mt-6

                  text-2xl
                  font-black
                  tracking-tight

                  !text-slate-900
                "
              >
                กำลังสร้าง QR Code PDF
              </h1>

              <p
                className="
                  mt-2

                  text-base
                  font-semibold
                  leading-relaxed

                  !text-slate-500
                "
              >
                ระบบกำลังจัดเตรียม QR Code
                สำหรับรายการพัสดุทั้งหมด
              </p>

              {/* ===============================================
                  PROGRESS BAR
              =============================================== */}

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
                    from-emerald-500
                    to-green-600

                    transition-[width]
                    duration-200
                    ease-out
                  "
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              {/* ===============================================
                  PROGRESS TEXT
              =============================================== */}

              <div
                className="
                  mt-3

                  text-sm
                  font-extrabold

                  !text-emerald-700
                "
              >
                {progress.toLocaleString(
                  "th-TH"
                )}
                %
              </div>

              {/* ===============================================
                  MATERIAL COUNT
              =============================================== */}

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

                  shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]

                  backdrop-blur-xl
                "
              >
                พบ{" "}
                {materials.length.toLocaleString(
                  "th-TH"
                )}{" "}
                รายการ
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}