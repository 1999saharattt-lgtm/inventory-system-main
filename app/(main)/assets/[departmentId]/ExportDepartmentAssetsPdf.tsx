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

   หมวดที่ใช้แสดงผล

   CABINET + SHELF
   = ตู้และชั้นวาง

   COMPUTER + MONITOR
   = คอมพิวเตอร์

   SHELF และ MONITOR ยังคงรองรับไว้
   สำหรับข้อมูลเดิมในฐานข้อมูล
   แต่จะไม่แสดงชื่อเป็นหมวดแยกใน PDF
   ========================================================= */

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  AIR_CONDITIONER: "เครื่องปรับอากาศ",
  TELEPHONE: "เครื่องโทรศัพท์",

  CABINET: "ตู้และชั้นวาง",
  SHELF: "ตู้และชั้นวาง",

  COMPUTER: "คอมพิวเตอร์",
  MONITOR: "คอมพิวเตอร์",

  PRINTER: "เครื่องพิมพ์",
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
  TELEPHONE: "เครื่อง",

  CABINET: "ตัว",
  SHELF: "ตัว",

  COMPUTER: "เครื่อง",
  MONITOR: "เครื่อง",

  PRINTER: "เครื่อง",
  OTHER: "รายการ",
  NO_SYSTEM: "รายการ",
};

/* =========================================================
   สถานะครุภัณฑ์
   ========================================================= */

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",

  // รองรับข้อมูลเดิม
  ACTIVE: "ยังใช้งาน",
  INACTIVE: "ไม่ใช้งาน",

  DAMAGED: "ชำรุด",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",

  // รองรับข้อมูลเดิม
  LOST: "สูญหาย",
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
   ผู้รับผิดชอบ

   กลุ่มอำนวยการ
   = ชื่อ นามสกุล / ชื่องาน

   กลุ่มอื่น
   = ชื่อ นามสกุล

   หมายเหตุ:
   หน้า /assets/[departmentId]/all
   อาจส่ง officerName ที่เป็น responsibleName
   จากทะเบียนต้นฉบับมาแล้ว

   จึงต้องป้องกันการต่อ Section ซ้ำ
   ========================================================= */

function getResponsibleName(asset: Asset) {
  const officerName =
    asset.officerName?.trim() || "";

  const sectionName =
    asset.sectionName?.trim() || "";

  const assetDepartmentName =
    asset.departmentName?.trim() || "";

  /* =======================================================
     กลุ่มอำนวยการ
     ======================================================= */

  if (
    assetDepartmentName ===
    "กลุ่มอำนวยการ"
  ) {
    /*
     * มีทั้งข้อมูลผู้รับผิดชอบ
     * และ Section
     */

    if (
      officerName &&
      sectionName
    ) {
      /*
       * ป้องกันกรณี officerName
       * มี "/ ชื่องาน" อยู่แล้ว
       */

      if (
        officerName.includes(
          ` / ${sectionName}`
        ) ||
        officerName.endsWith(
          `/${sectionName}`
        )
      ) {
        return officerName;
      }

      /*
       * กรณี responsibleName
       * เป็นข้อความสถานที่
       */

      if (
        officerName.startsWith("ห้อง")
      ) {
        return officerName;
      }

      /*
       * กรณีข้อความเป็นชื่องานอยู่แล้ว
       */

      if (
        officerName.startsWith("งาน")
      ) {
        return officerName;
      }

      /*
       * กรณีชื่อบุคคลจริง
       * ต่อด้วย Section
       */

      return `${officerName} / ${sectionName}`;
    }

    /*
     * มีเฉพาะผู้รับผิดชอบ
     */

    if (officerName) {
      return officerName;
    }

    /*
     * มีเฉพาะ Section
     */

    if (sectionName) {
      return sectionName;
    }

    return assetDepartmentName || "-";
  }

  /* =======================================================
     กลุ่มอื่น
     ======================================================= */

  if (officerName) {
    return officerName;
  }

  if (assetDepartmentName) {
    return assetDepartmentName;
  }

  return "-";
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function ExportDepartmentAssetsPdf({
  departmentName,
  assets,
}: Props) {
  const [isExporting, setIsExporting] =
    useState(false);

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

  const marginX =
    (pageWidth - tableWidth) / 2;

  /* =========================================================
     จำนวนรายการต่อหน้า
     ========================================================= */

  const rowsPerPage = 17;

  /* =========================================================
     EXPORT PDF
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

      const currentDate =
        new Date();

      const currentQuarter =
        getCurrentQuarter(
          currentDate
        );

      const fiscalYear =
        getFiscalYear(
          currentDate
        );

      /* =====================================================
         สร้าง PDF A4 แนวนอน
         ===================================================== */

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      /* =====================================================
         ฟอนต์ภาษาไทย
         ===================================================== */

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

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

      /* =====================================================
         สร้าง PDF ทีละหน้า
         ===================================================== */

      pages.forEach(
        (
          pageAssets,
          pageIndex
        ) => {
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

          const body =
            pageAssets.map(
              (
                asset,
                index
              ) => {
                const globalIndex =
                  pageIndex *
                    rowsPerPage +
                  index;

                const responsibleName =
                  getResponsibleName(
                    asset
                  );

                return [
                  /* ลำดับ */

                  globalIndex + 1,

                  /* ประเภท */

                  categoryName[
                    asset.category
                  ] ??
                    asset.category,

                  /* รหัส GFMIS */

                  asset.governmentAssetNo ??
                    "-",

                  /* รหัสครุภัณฑ์ */

                  asset.officeAssetNo ??
                    "-",

                  /* รายการครุภัณฑ์ */

                  asset.name || "-",

                  /* จำนวน */

                  "1",

                  /* หน่วย */

                  categoryUnit[
                    asset.category
                  ] ?? "รายการ",

                  /* ผู้รับผิดชอบ */

                  responsibleName,

                  /* สถานะ */

                  statusName[
                    asset.status
                  ] ??
                    asset.status,
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
               ตารางอยู่กึ่งกลาง
               ------------------------------------------------ */

            margin: {
              left: marginX,
              right: marginX,
            },

            /* ------------------------------------------------
               ความกว้างรวม
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

            body,

            theme: "grid",

            /* =================================================
               รูปแบบตารางพื้นฐาน
               ================================================= */

            styles: {
              font:
                "2.3.2 THSarabunNew",

              fontStyle:
                "normal",

              fontSize: 13,

              cellPadding: 1.2,

              halign: "center",

              valign: "middle",

              lineColor: [
                0,
                0,
                0,
              ],

              lineWidth: 0.25,

              minCellHeight: 7.2,

              overflow:
                "linebreak",

              textColor: [
                0,
                0,
                0,
              ],
            },

            /* =================================================
               หัวตาราง
               ================================================= */

            headStyles: {
              font:
                "2.3.2 THSarabunNew",

              fontStyle:
                "normal",

              fontSize: 13,

              fillColor: [
                255,
                255,
                255,
              ],

              textColor: [
                0,
                0,
                0,
              ],

              halign:
                "center",

              valign:
                "middle",

              lineColor: [
                0,
                0,
                0,
              ],

              lineWidth: 0.25,

              cellPadding: 1.3,

              minCellHeight: 9,

              overflow:
                "linebreak",
            },

            /* =================================================
               ข้อมูลในตาราง
               ================================================= */

            bodyStyles: {
              font:
                "2.3.2 THSarabunNew",

              fontStyle:
                "normal",

              fontSize: 13,

              textColor: [
                0,
                0,
                0,
              ],

              halign:
                "center",

              valign:
                "middle",

              cellPadding: 1.2,

              minCellHeight: 7.2,

              overflow:
                "linebreak",
            },

            /* =================================================
               ความกว้างและตำแหน่งแต่ละคอลัมน์
               ================================================= */

            columnStyles: {
              /* ลำดับ */

              0: {
                cellWidth: 10,
                halign: "center",
                valign: "middle",
              },

              /* ประเภท */

              1: {
                cellWidth: 29,
                halign: "center",
                valign: "middle",
              },

              /* รหัส GFMIS */

              2: {
                cellWidth: 34,
                halign: "center",
                valign: "middle",
              },

              /* รหัสครุภัณฑ์ */

              3: {
                cellWidth: 42,
                halign: "center",
                valign: "middle",
              },

              /* =================================================
                 รายการครุภัณฑ์

                 คงเดิม: ข้อมูลชิดซ้าย
                 ================================================= */

              4: {
                cellWidth: 62,
                halign: "left",
                valign: "middle",

                cellPadding: {
                  top: 1.2,
                  right: 1.2,
                  bottom: 1.2,
                  left: 2,
                },
              },

              /* จำนวน */

              5: {
                cellWidth: 12,
                halign: "center",
                valign: "middle",
              },

              /* หน่วย */

              6: {
                cellWidth: 16,
                halign: "center",
                valign: "middle",
              },

              /* =================================================
                 ผู้รับผิดชอบ

                 แก้ไข:
                 - ข้อมูลอยู่กึ่งกลางแนวนอน
                 - ข้อมูลอยู่กึ่งกลางแนวตั้ง
                 - รองรับข้อความหลายบรรทัด
                 ================================================= */

              7: {
                cellWidth: 45,
                halign: "center",
                valign: "middle",

                cellPadding: {
                  top: 1.2,
                  right: 1.2,
                  bottom: 1.2,
                  left: 1.2,
                },

                overflow:
                  "linebreak",
              },

              /* สถานะ */

              8: {
                cellWidth: 20,
                halign: "center",
                valign: "middle",
              },
            },

            /* =================================================
               บังคับตำแหน่งข้อความ

               - หัว "รายการครุภัณฑ์" อยู่กึ่งกลาง
               - ข้อมูล "รายการครุภัณฑ์" ชิดซ้าย
               - หัว "ผู้รับผิดชอบ" อยู่กึ่งกลาง
               - ข้อมูล "ผู้รับผิดชอบ" อยู่กึ่งกลาง
               ================================================= */

            didParseCell: (
              data
            ) => {
              /*
               * หัวรายการครุภัณฑ์
               */

              if (
                data.section ===
                  "head" &&
                data.column.index === 4
              ) {
                data.cell.styles.halign =
                  "center";

                data.cell.styles.valign =
                  "middle";
              }

              /*
               * หัวผู้รับผิดชอบ
               */

              if (
                data.section ===
                  "head" &&
                data.column.index === 7
              ) {
                data.cell.styles.halign =
                  "center";

                data.cell.styles.valign =
                  "middle";
              }

              /*
               * ข้อมูลผู้รับผิดชอบ
               *
               * บังคับกึ่งกลางทุกแถว
               */

              if (
                data.section ===
                  "body" &&
                data.column.index === 7
              ) {
                data.cell.styles.halign =
                  "center";

                data.cell.styles.valign =
                  "middle";
              }
            },

            /* =================================================
               เส้นกรอบตาราง
               ================================================= */

            tableLineColor: [
              0,
              0,
              0,
            ],

            tableLineWidth:
              0.25,
          });
        }
      );

      /* =====================================================
         เปิด PDF
         ===================================================== */

      const pdfBlob =
        doc.output("blob");

      const pdfUrl =
        URL.createObjectURL(
          pdfBlob
        );

      const newWindow =
        window.open(
          pdfUrl,
          "_blank",
          "noopener,noreferrer"
        );

      if (!newWindow) {
        const link =
          document.createElement(
            "a"
          );

        link.href = pdfUrl;

        link.target =
          "_blank";

        link.rel =
          "noopener noreferrer";

        link.click();
      }

      /* =====================================================
         ล้าง Object URL
         ===================================================== */

      setTimeout(() => {
        URL.revokeObjectURL(
          pdfUrl
        );
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
        onClick={
          handleExportPdf
        }
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