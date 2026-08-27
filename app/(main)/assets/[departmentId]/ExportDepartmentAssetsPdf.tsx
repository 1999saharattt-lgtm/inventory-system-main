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
   ต.ค. - ก.ย.
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
   * A4 แนวนอน
   *
   * 297 x 210 mm
   */

  const pageWidth = 297;

  /*
   * ความกว้างตาราง
   *
   * ตารางอยู่กึ่งกลางหน้า A4
   */

  const tableWidth = 270;

  const marginX =
    (pageWidth - tableWidth) / 2;

  /*
   * 17 รายการต่อหน้า
   *
   * ดังนั้นรายการที่ 18 จะขึ้นหน้าใหม่
   * พร้อม Header ใหม่ทั้งหมด
   */

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

      /*
       * คำนวณรอบไตรมาสและปีงบประมาณปัจจุบัน
       * ใหม่ทุกครั้งที่กด Export
       */

      const currentDate = new Date();

      const currentQuarter =
        getCurrentQuarter(currentDate);

      const fiscalYear =
        getFiscalYear(currentDate);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      /*
       * แบ่งข้อมูลเป็นชุดละ 17 รายการ
       */

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
         สร้าง PDF ทีละหน้า
         ทุกหน้ามี Header ใหม่ทั้งหมด
         ===================================================== */

      pages.forEach(
        (pageAssets, pageIndex) => {
          /*
           * หน้าแรกใช้หน้าที่สร้างไว้แล้ว
           * หน้าถัดไปสร้างหน้าใหม่
           */

          if (pageIndex > 0) {
            doc.addPage(
              "a4",
              "landscape"
            );
          }

          const center =
            pageWidth / 2;

          /* =================================================
             HEADER
             ================================================= */

          /*
           * บรรทัดที่ 1
           */

          doc.setFontSize(26);

          doc.text(
            "ทะเบียนคุมครุภัณฑ์",
            center,
            15,
            {
              align: "center",
            }
          );

          /*
           * บรรทัดที่ 2
           * กลุ่มงาน + สำนักอนามัยการเจริญพันธุ์
           * อยู่บรรทัดเดียวกัน
           */

          doc.setFontSize(16);

          doc.text(
            `${departmentName} สำนักอนามัยการเจริญพันธุ์`,
            center,
            23,
            {
              align: "center",
            }
          );

          /*
           * บรรทัดที่ 3
           */

          doc.text(
            `รอบไตรมาสที่ ${currentQuarter} ปีงบประมาณ พ.ศ. ${fiscalYear}`,
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
              const globalIndex =
                pageIndex *
                  rowsPerPage +
                index;

              return [
                /*
                 * ลำดับ
                 */

                globalIndex + 1,

                /*
                 * ประเภท
                 */

                categoryName[
                  asset.category
                ] ?? asset.category,

                /*
                 * รหัส GFMIS
                 */

                asset.governmentAssetNo ??
                  "-",

                /*
                 * รหัสครุภัณฑ์
                 */

                asset.officeAssetNo ??
                  "-",

                /*
                 * รายการครุภัณฑ์
                 */

                asset.name || "-",

                /*
                 * หน่วย
                 */

                categoryUnit[
                  asset.category
                ] ?? "รายการ",

                /*
                 * ผู้รับผิดชอบ
                 */

                asset.officerName ??
                  asset.sectionName ??
                  asset.departmentName ??
                  "-",

                /*
                 * สถานะ
                 */

                statusName[
                  asset.status
                ] ?? asset.status,
              ];
            }
          );

          /*
           * เติมแถวว่างให้ครบ 17 แถว
           */

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
            ]);
          }

          /* =================================================
             TABLE
             ================================================= */

          autoTable(doc, {
            /*
             * ตารางเริ่มหลัง Header
             */

            startY: 37,

            /*
             * ตารางกว้าง 270 mm
             * อยู่กึ่งกลางหน้า A4
             */

            margin: {
              left: marginX,
              right: marginX,
            },

            tableWidth,

            /*
             * หัวตาราง
             */

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

            /*
             * ตารางมีเส้นสีดำ
             */

            theme: "grid",

            /* =================================================
               รูปแบบพื้นฐานของตาราง
               ================================================= */

            styles: {
              font: "2.3.2 THSarabunNew",
              fontStyle: "normal",

              /*
               * ฟ้อนข้อมูล 14 pt
               */

              fontSize: 14,

              /*
               * เพิ่มระยะห่างภายในช่อง
               */

              cellPadding: 1.5,

              /*
               * ทุกช่องกึ่งกลาง
               */

              halign: "center",
              valign: "middle",

              /*
               * เส้นตารางสีดำ
               */

              lineColor: [0, 0, 0],
              lineWidth: 0.25,

              /*
               * ความสูงแถว
               */

              minCellHeight: 7.2,

              /*
               * ไม่ตัดข้อมูลเป็น ...
               *
               * ใช้ linebreak เพื่อไม่ให้ข้อมูลหาย
               * หากข้อความยาวกว่าพื้นที่
               */

              overflow: "linebreak",

              /*
               * ตัวอักษรสีดำ
               */

              textColor: [0, 0, 0],
            },

            /* =================================================
               หัวตาราง
               ================================================= */

            headStyles: {
              font: "2.3.2 THSarabunNew",
              fontStyle: "normal",

              /*
               * ฟ้อนหัวตาราง 14 pt
               */

              fontSize: 14,

              /*
               * พื้นหลังสีขาว
               */

              fillColor: [255, 255, 255],

              /*
               * บังคับสีฟ้อนเป็นดำ
               */

              textColor: [0, 0, 0],

              /*
               * กึ่งกลางทั้งแนวนอนและแนวตั้ง
               */

              halign: "center",
              valign: "middle",

              /*
               * เส้นสีดำ
               */

              lineColor: [0, 0, 0],
              lineWidth: 0.25,

              /*
               * ระยะห่างภายในหัวตาราง
               */

              cellPadding: 1.7,

              /*
               * เพิ่มความสูงหัวตาราง
               * ให้ตัวหนังสือไม่ติดกัน
               */

              minCellHeight: 9,

              /*
               * ไม่ตัดข้อมูลทิ้ง
               */

              overflow: "linebreak",
            },

            /* =================================================
               ข้อมูลในตาราง
               ================================================= */

            bodyStyles: {
              font: "2.3.2 THSarabunNew",
              fontStyle: "normal",
              fontSize: 14,

              textColor: [0, 0, 0],

              /*
               * กึ่งกลางแนวตั้ง
               */

              valign: "middle",

              cellPadding: 1.5,

              minCellHeight: 7.2,

              /*
               * ไม่ตัดข้อมูลทิ้ง
               */

              overflow: "linebreak",
            },

            /* =================================================
               ความกว้างคอลัมน์
               รวม = 270 mm
               ================================================= */

            columnStyles: {
              /*
               * ลำดับ
               * ลดความกว้างลง
               */

              0: {
                cellWidth: 12,
                halign: "center",
                valign: "middle",
              },

              /*
               * ประเภท
               * ลดความกว้างลง
               */

              1: {
                cellWidth: 30,
                halign: "center",
                valign: "middle",
              },

              /*
               * รหัส GFMIS
               */

              2: {
                cellWidth: 37,
                halign: "center",
                valign: "middle",
              },

              /*
               * รหัสครุภัณฑ์
               */

              3: {
                cellWidth: 38,
                halign: "center",
                valign: "middle",
              },

              /*
               * รายการครุภัณฑ์
               *
               * เฉพาะข้อมูลคอลัมน์นี้ชิดซ้าย
               */

              4: {
                cellWidth: 61,
                halign: "left",
                valign: "middle",
              },

              /*
               * หน่วย
               */

              5: {
                cellWidth: 18,
                halign: "center",
                valign: "middle",
              },

              /*
               * ผู้รับผิดชอบ
               */

              6: {
                cellWidth: 49,
                halign: "center",
                valign: "middle",
              },

              /*
               * สถานะ
               */

              7: {
                cellWidth: 25,
                halign: "center",
                valign: "middle",
              },
            },

            /*
             * เส้นกรอบตารางสีดำ
             */

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