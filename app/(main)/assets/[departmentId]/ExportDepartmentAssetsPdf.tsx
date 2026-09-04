"use client";

import "@/lib/fonts/THSarabunNew-normal";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Asset = {
  id: number;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  governmentAssetNo: string | null;
  officeAssetNo: string | null;
  departmentName: string;
  sectionName: string | null;
  officerName: string | null;
  status: string;
  purchaseDate: string | null;
  price: number | null;
  location: string | null;
  remark: string | null;
};

type Props = {
  departmentName: string;
  assets: Asset[];
};

/* =========================================================
   ชื่อประเภทครุภัณฑ์
   ========================================================= */

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  AIR_CONDITIONER: "เครื่องปรับอากาศ",
  CABINET: "ตู้และชั้น",
  COMPUTER: "คอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "เครื่องโทรศัพท์",
  OTHER: "ทั่วไป",
  NO_SYSTEM: "ไม่มีอยู่ในระบบ",
};

/* =========================================================
   หน่วยของครุภัณฑ์
   ========================================================= */

const categoryUnit: Record<string, string> = {
  DESK: "ตัว",
  CHAIR: "ตัว",
  AIR_CONDITIONER: "เครื่อง",
  CABINET: "ตัว",
  COMPUTER: "เครื่อง",
  PRINTER: "เครื่อง",
  TELEPHONE: "เครื่อง",
  OTHER: "รายการ",
  NO_SYSTEM: "รายการ",
};

/* =========================================================
   สถานะครุภัณฑ์
   ========================================================= */

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  DAMAGED: "ชำรุด",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

/* =========================================================
   ปีงบประมาณราชการ
   ต.ค. - ก.ย.
   ========================================================= */

function getFiscalYear(date: Date) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (month >= 10) {
    return year + 1 + 543;
  }

  return year + 543;
}

/* =========================================================
   รอบไตรมาสปัจจุบัน

   ต.ค. - ธ.ค. = 1
   ม.ค. - มี.ค. = 2
   เม.ย. - มิ.ย. = 3
   ก.ค. - ก.ย. = 4
   ========================================================= */

function getCurrentQuarter(date: Date) {
  const month = date.getMonth() + 1;

  if (month >= 10 && month <= 12) {
    return 1;
  }

  if (month >= 1 && month <= 3) {
    return 2;
  }

  if (month >= 4 && month <= 6) {
    return 3;
  }

  return 4;
}

/* =========================================================
   Component
   ========================================================= */

export default function ExportDepartmentAssetsPdf({
  departmentName,
  assets,
}: Props) {
  const [isExporting, setIsExporting] = useState(false);

  /* =========================================================
     A4 แนวนอน
     297 x 210 mm
     ========================================================= */

  const pageWidth = 297;

  /* =========================================================
     ความกว้างตาราง
     ========================================================= */

  const tableWidth = 270;

  /* =========================================================
     จัดตารางให้อยู่กึ่งกลางหน้า
     ========================================================= */

  const marginX = (pageWidth - tableWidth) / 2;

  /* =========================================================
     จำนวนรายการต่อหน้า
     ========================================================= */

  const rowsPerPage = 17;

  /* =========================================================
     Export PDF
     ========================================================= */

  async function handleExportPdf() {
    if (assets.length === 0) {
      return;
    }

    try {
      setIsExporting(true);

      /* =====================================================
         คำนวณไตรมาสและปีงบประมาณ
         ===================================================== */

      const currentDate = new Date();

      const currentQuarter =
        getCurrentQuarter(currentDate);

      const fiscalYear =
        getFiscalYear(currentDate);

      /* =====================================================
         สร้างเอกสาร PDF A4 แนวนอน
         ===================================================== */

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      /* =====================================================
         ตั้งฟอนต์ภาษาไทย
         ===================================================== */

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      /* =====================================================
         แบ่งข้อมูลเป็นหน้า ๆ
         ===================================================== */

      const pages: Asset[][] = [];

      for (
        let i = 0;
        i < assets.length;
        i += rowsPerPage
      ) {
        pages.push(
          assets.slice(
            i,
            i + rowsPerPage
          )
        );
      }

      /* =====================================================
         สร้าง PDF ทีละหน้า

         Header จะถูกสร้างใหม่ทุกหน้า
         ===================================================== */

      pages.forEach(
        (pageAssets, pageIndex) => {
          /* =================================================
             หน้าแรกใช้หน้าที่สร้างโดย jsPDF
             หน้าถัดไปเพิ่มหน้าใหม่
             ================================================= */

          if (pageIndex > 0) {
            doc.addPage(
              "a4",
              "landscape"
            );
          }

          const center = pageWidth / 2;

          /* =================================================
             HEADER
             ================================================= */

          doc.setFont(
            "2.3.2 THSarabunNew",
            "normal"
          );

          /* -------------------------------------------------
             บรรทัดที่ 1
             ------------------------------------------------- */

          doc.setFontSize(26);

          doc.text(
            "ทะเบียนคุมครุภัณฑ์",
            center,
            15,
            {
              align: "center",
            }
          );

          /* -------------------------------------------------
             บรรทัดที่ 2
             ------------------------------------------------- */

          doc.setFontSize(16);

          const departmentHeader =
            departmentName +
            " สำนักอนามัยการเจริญพันธุ์";

          doc.text(
            departmentHeader,
            center,
            23,
            {
              align: "center",
            }
          );

          /* -------------------------------------------------
             บรรทัดที่ 3
             ------------------------------------------------- */

          const fiscalHeader =
            "รอบไตรมาสที่ " +
            currentQuarter +
            " ปีงบประมาณ พ.ศ. " +
            fiscalYear;

          doc.text(
            fiscalHeader,
            center,
            31,
            {
              align: "center",
            }
          );

          /* =================================================
             TABLE DATA
             ================================================= */

          const body = pageAssets.map(
            (asset, index) => {
              /* ---------------------------------------------
                 คำนวณลำดับจริงของรายการ
                 --------------------------------------------- */

              const globalIndex =
                pageIndex *
                  rowsPerPage +
                index;

              return [
                /* ลำดับ */
                globalIndex + 1,

                /* ประเภท */
                categoryName[
                  asset.category
                ] ?? asset.category,

                /* รหัส GFMIS */
                asset.governmentAssetNo ?? "-",

                /* รหัสครุภัณฑ์ */
                asset.officeAssetNo ?? "-",

                /* รายการครุภัณฑ์ */
                asset.name || "-",

                /* จำนวน */
                "1",

                /* หน่วย */
                categoryUnit[
                  asset.category
                ] ?? "รายการ",

                /* ผู้รับผิดชอบ */
                asset.officerName ??
                  asset.sectionName ??
                  asset.departmentName ??
                  "-",

                /* สถานะ */
                statusName[
                  asset.status
                ] ?? asset.status,
              ];
            }
          );

          /* =================================================
             เติมแถวว่างให้ครบ 17 แถว
             ================================================= */

          while (
            body.length <
            rowsPerPage
          ) {
            body.push([
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
            ]);
          }

          /* =================================================
             TABLE
             ================================================= */

          autoTable(doc, {
            /* ------------------------------------------------
               เริ่มตารางหลัง Header
               ------------------------------------------------ */

            startY: 37,

            /* ------------------------------------------------
               จัดตารางให้อยู่กึ่งกลางหน้า
               ------------------------------------------------ */

            margin: {
              left: marginX,
              right: marginX,
            },

            /* ------------------------------------------------
               ความกว้างรวม 270 mm
               ------------------------------------------------ */

            tableWidth,

            /* ------------------------------------------------
               หัวตาราง
               ------------------------------------------------ */

            head: [
              [
                "ลำดับ",
                "ประเภท",
                "รหัส GFMIS",
                "รหัสครุภัณฑ์",
                "รายการครุภัณฑ์",
                "จำนวน",
                "หน่วย",
                "ผู้รับผิดชอบ",
                "สถานะ",
              ],
            ],

            /* ------------------------------------------------
               ข้อมูล
               ------------------------------------------------ */

            body,

            /* ------------------------------------------------
               ตารางแบบมีเส้น
               ------------------------------------------------ */

            theme: "grid",

            /* =================================================
               รูปแบบตารางพื้นฐาน
               ================================================= */

            styles: {
              font: "2.3.2 THSarabunNew",
              fontStyle: "normal",
              fontSize: 13,

              cellPadding: 1.2,

              halign: "center",
              valign: "middle",

              lineColor: [0, 0, 0],
              lineWidth: 0.25,

              minCellHeight: 7.2,

              overflow: "linebreak",

              textColor: [0, 0, 0],
            },

            /* =================================================
               หัวตาราง
               ================================================= */

            headStyles: {
              font: "2.3.2 THSarabunNew",
              fontStyle: "normal",
              fontSize: 13,

              /* พื้นหลังสีขาว */
              fillColor: [255, 255, 255],

              /* ตัวอักษรสีดำ */
              textColor: [0, 0, 0],

              halign: "center",
              valign: "middle",

              lineColor: [0, 0, 0],
              lineWidth: 0.25,

              cellPadding: 1.3,

              minCellHeight: 9,

              overflow: "linebreak",
            },

            /* =================================================
               ข้อมูลในตาราง
               ================================================= */

            bodyStyles: {
              font: "2.3.2 THSarabunNew",
              fontStyle: "normal",
              fontSize: 13,

              textColor: [0, 0, 0],

              valign: "middle",

              cellPadding: 1.2,

              minCellHeight: 7.2,

              overflow: "linebreak",
            },

            /* =================================================
               ความกว้างคอลัมน์

               รวมทั้งหมด = 270 mm

               10 + 29 + 34 + 42 + 62
               + 12 + 16 + 45 + 20
               = 270 mm

               ปรับ:
               รหัสครุภัณฑ์ 34 → 42 mm
               สถานะ         28 → 20 mm
               ================================================= */

            columnStyles: {
              /* ------------------------------------------------
                 0 - ลำดับ
                 ------------------------------------------------ */

              0: {
                cellWidth: 10,
                halign: "center",
                valign: "middle",
              },

              /* ------------------------------------------------
                 1 - ประเภท
                 ------------------------------------------------ */

              1: {
                cellWidth: 29,
                halign: "center",
                valign: "middle",
              },

              /* ------------------------------------------------
                 2 - รหัส GFMIS
                 ------------------------------------------------ */

              2: {
                cellWidth: 34,
                halign: "center",
                valign: "middle",
              },

              /* ------------------------------------------------
                 3 - รหัสครุภัณฑ์
                 เพิ่มจาก 34 เป็น 42 mm
                 เพื่อไม่ให้รหัสตกบรรทัด
                 ------------------------------------------------ */

              3: {
                cellWidth: 42,
                halign: "center",
                valign: "middle",
              },

              /* ------------------------------------------------
                 4 - รายการครุภัณฑ์
                 ------------------------------------------------ */

              4: {
                cellWidth: 62,
                halign: "left",
                valign: "middle",
              },

              /* ------------------------------------------------
                 5 - จำนวน
                 ------------------------------------------------ */

              5: {
                cellWidth: 12,
                halign: "center",
                valign: "middle",
              },

              /* ------------------------------------------------
                 6 - หน่วย
                 ------------------------------------------------ */

              6: {
                cellWidth: 16,
                halign: "center",
                valign: "middle",
              },

              /* ------------------------------------------------
                 7 - ผู้รับผิดชอบ
                 ------------------------------------------------ */

              7: {
                cellWidth: 45,
                halign: "center",
                valign: "middle",
              },

              /* ------------------------------------------------
                 8 - สถานะ
                 ลดจาก 28 เป็น 20 mm
                 ------------------------------------------------ */

              8: {
                cellWidth: 20,
                halign: "center",
                valign: "middle",
              },
            },

            /* =================================================
               เส้นกรอบตาราง
               ================================================= */

            tableLineColor: [0, 0, 0],
            tableLineWidth: 0.25,
          });
        }
      );

      /* =====================================================
         เปิด PDF
         ===================================================== */

      const pdfBlob =
        doc.output("blob");

      const pdfUrl =
        URL.createObjectURL(pdfBlob);

      const newWindow =
        window.open(
          pdfUrl,
          "_blank",
          "noopener,noreferrer"
        );

      if (!newWindow) {
        const link =
          document.createElement("a");

        link.href = pdfUrl;
        link.target = "_blank";
        link.rel =
          "noopener noreferrer";

        link.click();
      }

      /* =====================================================
         ล้าง Object URL หลังจากเปิดไฟล์
         ===================================================== */

      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 60000);
    } catch (error) {
      console.error(
        "ไม่สามารถสร้าง PDF ได้:",
        error
      );

      alert(
        "ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setIsExporting(false);
    }
  }

  /* =========================================================
     UI
     ========================================================= */

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={handleExportPdf}
        disabled={
          isExporting ||
          assets.length === 0
        }
        className="
          rounded-xl
          bg-gradient-to-r
          from-emerald-600
          to-green-500
          px-4
          py-3
          text-sm
          font-extrabold
          !text-white
          shadow-lg
          transition
          hover:scale-[1.02]
          hover:from-emerald-700
          hover:to-green-600
          active:scale-[0.98]
          disabled:cursor-not-allowed
          disabled:opacity-50
          sm:px-6
        "
      >
        {isExporting
          ? "⏳ กำลังสร้าง PDF..."
          : "📄 ส่งออก PDF"}
      </button>
    </div>
  );
}