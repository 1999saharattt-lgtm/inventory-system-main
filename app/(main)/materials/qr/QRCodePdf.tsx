"use client";

import "@/lib/fonts/THSarabunNew-normal";

import { useEffect } from "react";
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

export default function QRCodePdf({
  materials,
}: Props) {
  useEffect(() => {
    async function createPdf() {
      if (!materials || materials.length === 0) {
        return;
      }

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

      // ==========================================
      // ลำดับหมวดหมู่
      // ==========================================

      const categoryOrder = [
        "OFFICE",
        "COMPUTER",
        "ELECTRIC",
        "HOUSEHOLD",
        "VEHICLE",
        "PRINTING",
      ];

      // ==========================================
      // แบ่งรายการตามหมวด
      // และเรียงตามรหัสพัสดุจริงจากฐานข้อมูล
      // ==========================================

      const groupedMaterials =
        categoryOrder
          .map((category) => ({
            category,

            materials: materials
              .filter(
                (material) =>
                  material.category ===
                  category
              )
              .sort((a, b) => {
                const aCode = Number(
                  a.code.replace(/\D/g, "")
                );

                const bCode = Number(
                  b.code.replace(/\D/g, "")
                );

                // ==========================================
                // เรียงรหัสตามตัวเลขจริง
                // เช่น 1, 2, 9, 10, 110, 111
                // ==========================================

                if (
                  !Number.isNaN(aCode) &&
                  !Number.isNaN(bCode)
                ) {
                  if (aCode !== bCode) {
                    return aCode - bCode;
                  }

                  // ถ้ารหัสซ้ำ ใช้ id เป็นตัวสำรอง
                  return a.id - b.id;
                }

                // ==========================================
                // กรณีรหัสไม่ใช่ตัวเลข
                // ใช้ natural sort
                // ==========================================

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

      // ==========================================
      // สร้าง PDF แยกตามหมวด
      // ==========================================

      for (const group of groupedMaterials) {
        const category =
          categoryName[group.category] ??
          group.category;

        const categoryMaterials =
          group.materials;

        let itemIndex = 0;

        // ==========================================
        // 16 รายการ / หน้า
        // 4 คอลัมน์ x 4 แถว
        // ==========================================

        const itemsPerPage = 16;

        while (
          itemIndex <
          categoryMaterials.length
        ) {
          // ==========================================
          // ขึ้นหน้าใหม่เมื่อไม่ใช่หน้าแรก
          // ==========================================

          if (!isFirstPage) {
            doc.addPage();
          }

          isFirstPage = false;

          // ==========================================
          // หัวหมวด
          // ==========================================

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

          // ==========================================
          // รายการของหน้านี้
          // ==========================================

          const pageMaterials =
            categoryMaterials.slice(
              itemIndex,
              itemIndex +
                itemsPerPage
            );

          // ==========================================
          // สร้าง QR แต่ละรายการ
          // ==========================================

          for (
            let position = 0;
            position <
            pageMaterials.length;
            position++
          ) {
            const material =
              pageMaterials[position];

            const column =
              position % columns;

            const row =
              Math.floor(
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

            // ==========================================
            // URL ของ QR
            // ใช้ material.id จริง
            // ==========================================

            const url = new URL(
              `/stock-card/material/${material.id}/pdf`,
              window.location.origin
            ).toString();

            const qrDataUrl =
              await QRCode.toDataURL(
                url,
                {
                  width: 500,
                  margin: 1,
                  errorCorrectionLevel:
                    "H",
                }
              );

            // ==========================================
            // กรอบ
            // ==========================================

            doc.setDrawColor(
              0,
              0,
              0
            );

            doc.setLineWidth(0.3);

            doc.rect(
              x,
              y,
              cardWidth,
              cardHeight
            );

            // ==========================================
            // QR Code
            // ==========================================

            const qrSize = 35;

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
              qrSize
            );

            // ==========================================
            // รหัสพัสดุ
            // ใช้ code จริงจากฐานข้อมูล
            // ==========================================

            doc.setFont(
              "2.3.2 THSarabunNew",
              "normal"
            );

            doc.setFontSize(11);

            doc.text(
              `รหัสพัสดุ : ${
                material.code || "-"
              }`,
              x +
                cardWidth / 2,
              y + 42,
              {
                align: "center",
              }
            );

            // ==========================================
            // ชื่อพัสดุ
            // ==========================================

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
              x +
                cardWidth / 2,
              y + 48,
              {
                align: "center",
              }
            );
          }

          // ==========================================
          // ไปหน้าถัดไปของหมวด
          // ==========================================

          itemIndex +=
            itemsPerPage;
        }
      }

      // ==========================================
      // เปิด PDF
      // ==========================================

      const blob =
        doc.output("blob");

      const url =
        URL.createObjectURL(blob);

      window.location.replace(
        url
      );
    }

    createPdf();
  }, [materials]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-xl font-bold text-slate-700">
        กำลังสร้าง QR Code PDF...
      </p>
    </div>
  );
}