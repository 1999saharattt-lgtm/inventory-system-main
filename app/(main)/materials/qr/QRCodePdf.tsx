"use client";

import "@/lib/fonts/THSarabunNew-normal";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import jsPDF from "jspdf";

type Material = {
  id: number;
  code: string;
  name: string;
  category: string;
};

type Props = {
  materials: Material[];
};

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

const categoryOrder = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

export default function QRCodePdf({
  materials,
}: Props) {
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function createPdf() {
      try {
        setError("");

        if (!materials || materials.length === 0) {
          setError("ยังไม่มีรายการพัสดุสำหรับสร้าง QR Code");
          return;
        }

        /* =====================================================
           PDF Configuration
        ===================================================== */

        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        doc.setFont(
          "2.3.2 THSarabunNew",
          "normal"
        );

        const pageWidth = 210;

        const marginX = 10;
        const marginY = 10;

        const columns = 4;

        const gapX = 3;
        const gapY = 5;

        const cardWidth =
          (pageWidth -
            marginX * 2 -
            gapX * (columns - 1)) /
          columns;

        const cardHeight = 58;

        const itemsPerPage = 16;

        /* =====================================================
           Group Materials
           เรียงตามหมวด และรหัสพัสดุจริง
        ===================================================== */

        const groupedMaterials = categoryOrder
          .map((category) => ({
            category,

            materials: materials
              .filter(
                (material) =>
                  material.category === category
              )
              .sort((a, b) => {
                const aCode = Number(
                  a.code.replace(/\D/g, "")
                );

                const bCode = Number(
                  b.code.replace(/\D/g, "")
                );

                /* =============================================
                   เรียงรหัสตามตัวเลขจริง
                   เช่น 1, 2, 9, 10, 110, 111
                ============================================= */

                if (
                  !Number.isNaN(aCode) &&
                  !Number.isNaN(bCode)
                ) {
                  if (aCode !== bCode) {
                    return aCode - bCode;
                  }

                  return a.id - b.id;
                }

                /* =============================================
                   กรณีรหัสไม่ใช่ตัวเลข
                   ใช้ Natural Sort
                ============================================= */

                const codeCompare =
                  a.code.localeCompare(
                    b.code,
                    "th",
                    {
                      numeric: true,
                      sensitivity: "base",
                    }
                  );

                if (codeCompare !== 0) {
                  return codeCompare;
                }

                return a.id - b.id;
              }),
          }))
          .filter(
            (group) =>
              group.materials.length > 0
          );

        let isFirstPage = true;

        /* =====================================================
           Create PDF
        ===================================================== */

        for (const group of groupedMaterials) {
          const category =
            categoryName[group.category] ??
            group.category;

          const categoryMaterials =
            group.materials;

          let itemIndex = 0;

          /* ===================================================
             16 รายการ / หน้า
             4 Columns x 4 Rows
          =================================================== */

          while (
            itemIndex <
            categoryMaterials.length
          ) {
            if (!isFirstPage) {
              doc.addPage();
            }

            isFirstPage = false;

            /* =================================================
               Category Header
            ================================================= */

            doc.setFont(
              "2.3.2 THSarabunNew",
              "normal"
            );

            doc.setFontSize(18);

            doc.text(
              category,
              pageWidth / 2,
              7,
              {
                align: "center",
              }
            );

            /* =================================================
               Materials For Current Page
            ================================================= */

            const pageMaterials =
              categoryMaterials.slice(
                itemIndex,
                itemIndex + itemsPerPage
              );

            /* =================================================
               Generate QR Code
            ================================================= */

            for (
              let position = 0;
              position < pageMaterials.length;
              position++
            ) {
              if (cancelled) {
                return;
              }

              const material =
                pageMaterials[position];

              const column =
                position % columns;

              const row = Math.floor(
                position / columns
              );

              const x =
                marginX +
                column *
                  (cardWidth + gapX);

              const y =
                marginY +
                5 +
                row *
                  (cardHeight + gapY);

              /* ===============================================
                 QR URL
                 ใช้ Material ID จริงจากฐานข้อมูล
              =============================================== */

              const materialUrl = new URL(
                `/stock-card/material/${material.id}/pdf`,
                window.location.origin
              ).toString();

              const qrDataUrl =
                await QRCode.toDataURL(
                  materialUrl,
                  {
                    width: 500,
                    margin: 1,
                    errorCorrectionLevel: "H",
                  }
                );

              /* ===============================================
                 Card Border
              =============================================== */

              doc.setDrawColor(0, 0, 0);

              doc.setLineWidth(0.3);

              doc.rect(
                x,
                y,
                cardWidth,
                cardHeight
              );

              /* ===============================================
                 QR Code
              =============================================== */

              const qrSize = 35;

              const qrX =
                x +
                (cardWidth - qrSize) / 2;

              const qrY = y + 3;

              doc.addImage(
                qrDataUrl,
                "PNG",
                qrX,
                qrY,
                qrSize,
                qrSize
              );

              /* ===============================================
                 Material Code
              =============================================== */

              doc.setFont(
                "2.3.2 THSarabunNew",
                "normal"
              );

              doc.setFontSize(11);

              doc.text(
                `รหัสพัสดุ : ${
                  material.code || "-"
                }`,
                x + cardWidth / 2,
                y + 42,
                {
                  align: "center",
                }
              );

              /* ===============================================
                 Material Name
              =============================================== */

              doc.setFontSize(9);

              const name =
                material.name || "-";

              const maxWidth =
                cardWidth - 4;

              const lines =
                doc.splitTextToSize(
                  name,
                  maxWidth
                );

              doc.text(
                lines.slice(0, 2),
                x + cardWidth / 2,
                y + 48,
                {
                  align: "center",
                }
              );
            }

            itemIndex += itemsPerPage;
          }
        }

        /* =====================================================
           Open Generated PDF
        ===================================================== */

        if (cancelled) {
          return;
        }

        const blob = doc.output("blob");

        objectUrl =
          URL.createObjectURL(blob);

        window.location.replace(
          objectUrl
        );
      } catch (err) {
        console.error(
          "ไม่สามารถสร้าง QR Code PDF ได้:",
          err
        );

        if (!cancelled) {
          setError(
            "ไม่สามารถสร้าง QR Code PDF ได้ กรุณาลองใหม่อีกครั้ง"
          );
        }
      }
    }

    createPdf();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [materials]);

  /* =========================================================
     Loading / Error Screen
  ========================================================= */

  return (
    <div
      className="
        flex
        min-h-[calc(100vh-180px)]
        w-full
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
        {/* Ambient Glow */}

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

        <div className="relative">
          {error ? (
            <>
              {/* Error Icon */}

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
                  bg-red-50
                  text-4xl
                  shadow-[0_14px_30px_-20px_rgba(239,68,68,0.5)]
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
                สร้าง QR Code ไม่สำเร็จ
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

              <a
                href="/materials"
                className="
                  mt-6
                  inline-flex
                  h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-[16px]
                  border
                  border-slate-200
                  bg-white
                  px-5
                  text-sm
                  font-extrabold
                  !text-slate-800
                  shadow-[0_10px_24px_-16px_rgba(15,23,42,0.35)]
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:bg-slate-50
                  active:translate-y-0
                  active:scale-[0.97]
                "
              >
                <span>←</span>
                <span>กลับรายการพัสดุ</span>
              </a>
            </>
          ) : (
            <>
              {/* QR Icon */}

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

              {/* iOS Style Progress */}

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
                "
              >
                พบ {materials.length} รายการ
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}