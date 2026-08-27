"use client";

import "@/lib/fonts/THSarabunNew-normal";

import React, { useState } from "react";
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

const statusName: Record<string, string> = {
  ACTIVE: "ใช้งานอยู่",
  INACTIVE: "ไม่ใช้งาน",
  DISPOSED: "จำหน่ายแล้ว",
  LOST: "สูญหาย",
};

/* =========================================================
   ปีงบประมาณราชการ
   ========================================================= */

function getFiscalYear(date: Date) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return month >= 10
    ? year + 1 + 543
    : year + 543;
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

  /*
   * จำนวนรายการต่อหน้า
   *
   * ใช้ขนาดฟ้อนและความสูงแถวตามมาตรฐาน
   * จากไฟล์ ExportPdf ที่ผู้ใช้กำหนด
   */

  const rowsPerPage = 10;

  /* =========================================================
     Export PDF
     ========================================================= */

  async function handleExportPdf() {
    if (assets.length === 0) {
      return;
    }

    try {
      setIsExporting(true);

      const currentDate = new Date();

      const currentQuarter =
        getCurrentQuarter(currentDate);

      const fiscalYear =
        getFiscalYear(currentDate);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const center = pageWidth / 2;

      /* =====================================================
         แบ่งข้อมูลเป็นหน้า
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

      if (pages.length === 0) {
        pages.push([]);
      }

      /* =====================================================
         สร้างแต่ละหน้า
         ===================================================== */

      pages.forEach(
        (pageAssets, pageIndex) => {
          if (pageIndex > 0) {
            doc.addPage();
          }

          /* ===============================================
             HEADER
             =============================================== */

          doc.setFontSize(26);

          doc.text(
            "ทะเบียนคุมครุภัณฑ์",
            center,
            16,
            {
              align: "center",
            }
          );

          doc.setFontSize(16);

          doc.text(
            departmentName
              ? departmentName
              : "กลุ่มอำนวยการ",
            center,
            23,
            {
              align: "center",
            }
          );

          doc.text(
            "สำนักอนามัยการเจริญพันธุ์",
            center,
            30,
            {
              align: "center",
            }
          );

          doc.text(
            `รอบไตรมาสที่ ${currentQuarter} ปีงบประมาณ พ.ศ. ${fiscalYear}`,
            center,
            37,
            {
              align: "center",
            }
          );

          /* ===============================================
             TABLE DATA
             =============================================== */

          const body = pageAssets.map(
            (asset, index) => {
              const globalIndex =
                pageIndex *
                  rowsPerPage +
                index;

              return [
                // ลำดับ
                globalIndex + 1,

                // ประเภท
                categoryName[
                  asset.category
                ] ?? asset.category,

                // รหัส GFMIS
                asset.governmentAssetNo ??
                  "-",

                // รหัสครุภัณฑ์
                asset.officeAssetNo ??
                  "-",

                // รายการครุภัณฑ์
                asset.name || "-",

                // หน่วย
                categoryUnit[
                  asset.category
                ] ?? "รายการ",

                // ผู้รับผิดชอบ
                asset.officerName ??
                  asset.sectionName ??
                  asset.departmentName ??
                  "-",

                // สถานะ
                statusName[
                  asset.status
                ] ?? asset.status,
              ];
            }
          );

          /* ===============================================
             เติมแถวเปล่าให้ครบ 10 แถว
             =============================================== */

          while (body.length < rowsPerPage) {
            body.push([
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

          /* ===============================================
             TABLE
             =============================================== */

          autoTable(doc, {
            startY: 43,

            head: [
              [
                "ลำดับ",
                "ประเภท",
                "รหัส GFMIS",
                "รหัสครุภัณฑ์",
                "รายการครุภัณฑ์",
                "หน่วย",
                "ผู้รับผิดชอบ",
                "สถานะ",
              ],
            ],

            body,

            theme: "grid",

            styles: {
              font: "2.3.2 THSarabunNew",
              fontStyle: "normal",
              fontSize: 16,

              /*
               * ขนาดและระยะห่างอิงจากไฟล์มาตรฐาน
               */

              cellPadding: 2.5,

              /*
               * ให้ข้อความอยู่กึ่งกลางแนวตั้ง
               */

              valign: "middle",

              /*
               * ค่าเริ่มต้นกึ่งกลาง
               */

              halign: "center",

              /*
               * เส้นตารางสีดำ
               */

              lineColor: [0, 0, 0],
              lineWidth: 0.25,

              /*
               * ความสูงขั้นต่ำของแต่ละแถว
               */

              minCellHeight: 8,

              /*
               * ป้องกันการบีบข้อความ
               * ให้พื้นที่ข้อความมีขนาดเหมาะสม
               */

              overflow: "visible",
            },

            headStyles: {
              font: "2.3.2 THSarabunNew",
              fontStyle: "normal",

              /*
               * ขนาดฟ้อนหัวตาราง
               */

              fontSize: 16,

              /*
               * พื้นหัวตารางสีขาว
               */

              fillColor: [255, 255, 255],

              /*
               * บังคับฟ้อนเป็นสีดำ
               */

              textColor: 0,

              /*
               * จัดกึ่งกลางทั้งแนวนอนและแนวตั้ง
               */

              halign: "center",
              valign: "middle",

              /*
               * เส้นตารางสีดำ
               */

              lineColor: [0, 0, 0],
              lineWidth: 0.25,

              /*
               * เพิ่มพื้นที่หัวตาราง
               */

              cellPadding: 2.5,
            },

            bodyStyles: {
              font: "2.3.2 THSarabunNew",
              fontStyle: "normal",
              fontSize: 16,
              textColor: 0,
              halign: "center",
              valign: "middle",
            },

            columnStyles: {
              /*
               * ลำดับ
               */

              0: {
                cellWidth: 18,
                halign: "center",
              },

              /*
               * ประเภท
               */

              1: {
                cellWidth: 38,
                halign: "center",
              },

              /*
               * รหัส GFMIS
               */

              2: {
                cellWidth: 38,
                halign: "center",
              },

              /*
               * รหัสครุภัณฑ์
               */

              3: {
                cellWidth: 40,
                halign: "center",
              },

              /*
               * รายการครุภัณฑ์
               */

              4: {
                cellWidth: 62,
                halign: "center",
              },

              /*
               * หน่วย
               */

              5: {
                cellWidth: 20,
                halign: "center",
              },

              /*
               * ผู้รับผิดชอบ
               */

              6: {
                cellWidth: 42,
                halign: "center",
              },

              /*
               * สถานะ
               */

              7: {
                cellWidth: 28,
                halign: "center",
              },
            },
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

  return (
    <div className="shrink-0">
      {/* =====================================================
          Export Button
      ===================================================== */}

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