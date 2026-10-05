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

type NumberedMaterial =
  Material & {
    sequence: number;
  };

type MaterialGroup = {
  category: string;
  materials: NumberedMaterial[];
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

/* =========================================================
   CATEGORY ORDER
========================================================= */

const categoryOrder = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

/* =========================================================
   QR CONFIG
========================================================= */

const QR_SIZE_PX = 300;

const QR_OPTIONS = {
  width:
    QR_SIZE_PX,

  margin:
    1,

  errorCorrectionLevel:
    "H" as const,
};

/* =========================================================
   NORMALIZE CODE
========================================================= */

function normalizeCode(
  value: string
) {
  return String(
    value ?? ""
  )
    .trim()
    .toUpperCase();
}

/* =========================================================
   NATURAL MATERIAL SORT

   สำคัญ:
   ใช้เพื่อ "เรียงรายการ" เท่านั้น

   ไม่ใช้ตัวเลขในรหัสเป็นเลขลำดับ

   ตัวอย่าง:
   COM-1
   COM-2
   COM-9
   COM-10
   COM-11

   จะเรียงถูกต้อง

   แต่ลำดับ PDF จะเป็น:
   1
   2
   3
   4
   5

   ไม่ใช่:
   1
   2
   9
   10
   11
========================================================= */

function compareMaterialCode(
  a: Material,
  b: Material
) {
  const codeA =
    normalizeCode(
      a.code
    );

  const codeB =
    normalizeCode(
      b.code
    );

  const compare =
    codeA.localeCompare(
      codeB,
      "th",
      {
        numeric: true,
        sensitivity:
          "base",
      }
    );

  if (
    compare !== 0
  ) {
    return compare;
  }

  /* =======================================================
     ถ้ารหัสเหมือนกัน
     เรียงชื่อ
  ======================================================= */

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

  /* =======================================================
     LAST FALLBACK

     ใช้ ID เฉพาะกันผล sort ไม่แน่นอน
     ไม่เกี่ยวกับเลขลำดับที่แสดง
  ======================================================= */

  return (
    a.id -
    b.id
  );
}

/* =========================================================
   BUILD MATERIAL GROUPS

   จุดแก้หลัก:

   แต่ละหมวดจะสร้าง sequence ใหม่เอง

   OFFICE
   1..n

   COMPUTER
   1..n

   ELECTRIC
   1..n

   HOUSEHOLD
   1..n

   VEHICLE
   1..n

   PRINTING
   1..n
========================================================= */

function buildMaterialGroups(
  materials: Material[]
): MaterialGroup[] {
  return categoryOrder
    .map(
      (
        category
      ): MaterialGroup => {
        const categoryMaterials =
          materials
            .filter(
              (
                material
              ) =>
                material.category ===
                category
            )
            .sort(
              compareMaterialCode
            )
            .map(
              (
                material,
                index
              ) => ({
                ...material,

                /* =========================================
                   ลำดับใหม่จริงของหมวด

                   ไม่ใช้:
                   - material.id
                   - เลขใน material.code
                   - index ของ array รวม
                ========================================= */

                sequence:
                  index + 1,
              })
            );

        return {
          category,
          materials:
            categoryMaterials,
        };
      }
    )
    .filter(
      (group) =>
        group.materials
          .length > 0
    );
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
  ] =
    useState("");

  /* =======================================================
     CREATE PDF
  ======================================================= */

  useEffect(() => {
    let objectUrl:
      string | null =
      null;

    let cancelled =
      false;

    async function createPdf() {
      try {
        setError("");

        /* =================================================
           VALIDATE
        ================================================= */

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

        /* =================================================
           GROUP + SORT + SEQUENCE

           ทำก่อนสร้าง PDF

           เลข sequence จะต่อเนื่อง
           แยกใหม่ทุกหมวด
        ================================================= */

        const groupedMaterials =
          buildMaterialGroups(
            materials
          );

        if (
          groupedMaterials.length ===
          0
        ) {
          setError(
            "ไม่พบรายการพัสดุสำหรับสร้าง QR Code"
          );

          return;
        }

        /* =================================================
           PDF CONFIGURATION
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
              true,
          });

        doc.setFont(
          "2.3.2 THSarabunNew",
          "normal"
        );

        /* =================================================
           PAGE SIZE
        ================================================= */

        const pageWidth =
          210;

        const marginX =
          10;

        const marginY =
          10;

        /* =================================================
           GRID
        ================================================= */

        const columns =
          4;

        const gapX =
          3;

        const gapY =
          5;

        const cardWidth =
          (
            pageWidth -
            marginX *
              2 -
            gapX *
              (
                columns -
                1
              )
          ) /
          columns;

        /*
         * เดิม 58 mm
         *
         * เพิ่มเล็กน้อยเพื่อรองรับ
         * "ลำดับ" + "รหัสพัสดุ"
         */

        const cardHeight =
          61;

        const itemsPerPage =
          16;

        const qrSize =
          35;

        let isFirstPage =
          true;

        /* =================================================
           CREATE CATEGORY BY CATEGORY
        ================================================= */

        for (
          const group of
            groupedMaterials
        ) {
          if (
            cancelled
          ) {
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
               NEW PAGE
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

               sequence ถูกสร้างไว้ก่อนแล้ว
               ดังนั้นเปลี่ยนหน้าแล้วไม่เริ่มใหม่

               เช่น:
               หน้า 1 = 1-16
               หน้า 2 = 17-32

               แต่เมื่อเปลี่ยน category:
               เริ่ม 1 ใหม่
            =============================================== */

            const pageMaterials =
              categoryMaterials.slice(
                itemIndex,
                itemIndex +
                  itemsPerPage
              );

            /* ===============================================
               GENERATE QR CODES IN PARALLEL
            =============================================== */

            const qrResults =
              await Promise.all(
                pageMaterials.map(
                  async (
                    material
                  ) => {
                    /* =====================================
                       QR URL

                       ใช้ material.id จริง
                       ไม่ใช้ sequence
                    ===================================== */

                    const materialUrl =
                      new URL(
                        `/stock-card/material/${material.id}/pdf`,
                        window
                          .location
                          .origin
                      ).toString();

                    const qrDataUrl =
                      await QRCode.toDataURL(
                        materialUrl,
                        QR_OPTIONS
                      );

                    return {
                      material,
                      qrDataUrl,
                    };
                  }
                )
              );

            if (
              cancelled
            ) {
              return;
            }

            /* ===============================================
               DRAW MATERIAL CARDS
            =============================================== */

            for (
              let position =
                0;

              position <
              qrResults.length;

              position++
            ) {
              const {
                material,
                qrDataUrl,
              } =
                qrResults[
                  position
                ];

              /* =============================================
                 POSITION
              ============================================= */

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
                marginY +
                5 +
                row *
                  (
                    cardHeight +
                    gapY
                  );

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
                 SEQUENCE

                 เลขลำดับใหม่
                 ต่อเนื่องเฉพาะภายในหมวด

                 ตัวอย่าง:
                 COMPUTER 1,2,3...
                 PRINTING 1,2,3...
              ============================================= */

              doc.setFont(
                "2.3.2 THSarabunNew",
                "normal"
              );

              doc.setFontSize(
                11
              );

              doc.text(
                `ลำดับ ${material.sequence}`,
                x +
                  cardWidth /
                    2,
                y + 4,
                {
                  align:
                    "center",
                }
              );

              /* =============================================
                 QR CODE
              ============================================= */

              const qrX =
                x +
                (
                  cardWidth -
                  qrSize
                ) /
                  2;

              const qrY =
                y + 6;

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

                 รหัสจริงจาก Database
                 ห้ามแก้ตาม sequence
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
                y + 44,
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
                y + 50,
                {
                  align:
                    "center",
                }
              );
            }

            /* ===============================================
               NEXT PAGE

               itemIndex ใช้แค่แบ่งหน้า
               ไม่ได้ใช้สร้างเลขลำดับ
            =============================================== */

            itemIndex +=
              itemsPerPage;

            /* ===============================================
               ALLOW BROWSER TO RENDER
            =============================================== */

            await new Promise<void>(
              (
                resolve
              ) => {
                setTimeout(
                  resolve,
                  0
                );
              }
            );
          }
        }

        /* =================================================
           CANCEL CHECK
        ================================================= */

        if (
          cancelled
        ) {
          return;
        }

        /* =================================================
           CREATE PDF BLOB
        ================================================= */

        const blob =
          doc.output(
            "blob"
          );

        if (
          cancelled
        ) {
          return;
        }

        objectUrl =
          URL.createObjectURL(
            blob
          );

        /* =================================================
           OPEN GENERATED PDF
        ================================================= */

        window.location.replace(
          objectUrl
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
       * ไม่ revoke ก่อน browser เปิด blob
       *
       * document จะถูก unload
       * หลัง window.location.replace()
       */
    };
  }, [
    materials,
  ]);

  /* =========================================================
     LOADING / ERROR
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
        {/* =================================================
            AMBIENT GLOW
        ================================================= */}

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

            bg-blue-400/10

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

            bg-cyan-400/10

            blur-3xl
          "
        />

        {/* =================================================
            TOP HIGHLIGHT
        ================================================= */}

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

        <div className="relative">
          {error ? (
            <>
              {/* =============================================
                  ERROR ICON
              ============================================= */}

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

              <h1
                className="
                  mt-6

                  text-2xl
                  font-black
                  tracking-tight

                  !text-slate-900
                "
              >
                สร้าง QR Code
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
                  icon={
                    <span>
                      ←
                    </span>
                  }
                >
                  กลับ
                </AppButton>
              </div>
            </>
          ) : (
            <>
              {/* =============================================
                  QR ICON
              ============================================= */}

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
                  from-slate-800
                  to-slate-950

                  text-4xl

                  shadow-[0_18px_38px_-20px_rgba(15,23,42,0.7)]

                  ring-1
                  ring-white/20
                "
              >
                📱
              </div>

              <h1
                className="
                  mt-6

                  text-2xl
                  font-black
                  tracking-tight

                  !text-slate-900
                "
              >
                กำลังสร้าง QR Code
                PDF
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
                ระบบกำลังจัดเตรียม
                QR Code
                สำหรับรายการพัสดุทั้งหมด
              </p>

              {/* =============================================
                  LOADING
              ============================================= */}

              <div
                className="
                  mx-auto
                  mt-6

                  flex
                  items-center
                  justify-center

                  gap-2
                "
              >
                <span
                  className="
                    h-2.5
                    w-2.5

                    animate-bounce

                    rounded-full

                    bg-slate-900

                    [animation-delay:-0.3s]
                  "
                />

                <span
                  className="
                    h-2.5
                    w-2.5

                    animate-bounce

                    rounded-full

                    bg-slate-600

                    [animation-delay:-0.15s]
                  "
                />

                <span
                  className="
                    h-2.5
                    w-2.5

                    animate-bounce

                    rounded-full

                    bg-slate-400
                  "
                />
              </div>

              {/* =============================================
                  MATERIAL COUNT
              ============================================= */}

              <div
                className="
                  mt-6

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