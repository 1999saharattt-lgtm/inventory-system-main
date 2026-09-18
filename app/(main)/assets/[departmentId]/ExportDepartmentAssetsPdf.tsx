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

  /*
   * รองรับข้อมูลที่ส่งตรงมาจากหน้า
   * /assets/[departmentId]/all
   */
  responsibleName?: string | null;

  department?: {
    name: string;
  } | null;

  section?: {
    name: string;
  } | null;

  officer?: {
    firstName: string;
    lastName: string;
  } | null;

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

   เก็บไว้รองรับข้อมูลเดิม
   แม้ PDF ชุดนี้จะไม่แสดงคอลัมน์ "ประเภท"
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

   ใช้รูปแบบเดียวกับหน้า
   /assets/[departmentId]/all

   ตัวอย่าง:
   กลุ่มอำนวยการ / หน้าห้องผู้อำนวยการ
   กลุ่มอำนวยการ / งานสารบรรณ
   ========================================================= */

function getResponsibleName(asset: Asset) {
  /* =======================================================
     ชื่อกลุ่ม
     รองรับทั้งข้อมูลแบบเดิมและข้อมูลจาก Prisma โดยตรง
     ======================================================= */

  const assetDepartmentName =
    asset.departmentName?.trim() ||
    asset.department?.name?.trim() ||
    "";

  /* =======================================================
     ผู้รับผิดชอบจากทะเบียน Excel

     responsibleName เป็นข้อมูลหลัก

     แต่ยังรองรับ officerName เดิม
     เพื่อไม่กระทบจุดที่เรียก Component แบบเก่า
     ======================================================= */

  const originalResponsibleName =
    asset.responsibleName?.trim() ||
    asset.officerName?.trim() ||
    "";

  if (
    originalResponsibleName &&
    originalResponsibleName !== "-"
  ) {
    /*
     * ถ้ามีชื่อกลุ่มนำหน้าอยู่แล้ว
     * ไม่เติมซ้ำ
     */

    if (
      assetDepartmentName &&
      (
        originalResponsibleName === assetDepartmentName ||
        originalResponsibleName.startsWith(
          `${assetDepartmentName} /`
        )
      )
    ) {
      return originalResponsibleName;
    }

    /*
     * ตัวอย่าง:
     *
     * กลุ่มอำนวยการ
     * +
     * หน้าห้องผู้อำนวยการ
     *
     * =
     * กลุ่มอำนวยการ / หน้าห้องผู้อำนวยการ
     */

    if (assetDepartmentName) {
      return `${assetDepartmentName} / ${originalResponsibleName}`;
    }

    return originalResponsibleName;
  }

  /* =======================================================
     ไม่มี responsibleName
     ใช้ section เป็น fallback
     ======================================================= */

  const sectionName =
    asset.sectionName?.trim() ||
    asset.section?.name?.trim() ||
    "";

  if (sectionName) {
    if (assetDepartmentName) {
      return `${assetDepartmentName} / ${sectionName}`;
    }

    return sectionName;
  }

  /* =======================================================
     ไม่มี responsibleName และ section
     ใช้ชื่อเจ้าหน้าที่เป็น fallback
     ======================================================= */

  const officerName =
    asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
      : "";

  if (officerName) {
    if (assetDepartmentName) {
      return `${assetDepartmentName} / ${officerName}`;
    }

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
         HEADER FUNCTION

         ใช้หัวเอกสารเดียวกันทุกหน้า
         ===================================================== */

      function drawPageHeader() {
        const center =
          pageWidth / 2;

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
          " ประจำปีงบประมาณ พ.ศ. " +
          fiscalYear;

        doc.text(
          fiscalHeader,
          center,
          31,
          {
            align: "center",
          }
        );
      }

      /* =====================================================
         TABLE DATA

         ไม่แบ่งข้อมูลเป็น 17 รายการเองแล้ว

         ให้ autoTable จัดหน้าตามพื้นที่จริง
         ===================================================== */

      const body =
        assets.map(
          (
            asset,
            index
          ) => {
            const responsibleName =
              getResponsibleName(
                asset
              );

            return [
              /* ลำดับ */

              index + 1,

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

      /* =====================================================
         TABLE

         สำคัญ:
         - autoTable จัดหน้าอัตโนมัติ
         - หน้าเต็มแล้วขึ้นหน้าใหม่ทันที
         - ทุกหน้ามี Header
         - ทุกหน้ามีหัวตาราง
         - ลำดับต่อเนื่อง
         ===================================================== */

      autoTable(doc, {
        /* --------------------------------------------------
           ตารางหน้าแรกเริ่มหลัง Header
           -------------------------------------------------- */

        startY: 37,

        /* --------------------------------------------------
           ระยะขอบ

           top = 37
           ทำให้หน้าถัดไปเริ่มตารางตำแหน่งเดียวกัน
           และเว้นพื้นที่สำหรับ Header เหมือนหน้าแรก
           -------------------------------------------------- */

        margin: {
          top: 37,
          left: marginX,
          right: marginX,
          bottom: 10,
        },

        /* --------------------------------------------------
           ความกว้างรวม
           -------------------------------------------------- */

        tableWidth,

        /* --------------------------------------------------
           หัวตาราง

           แสดงซ้ำทุกหน้า
           -------------------------------------------------- */

        head: [
          [
            "ลำดับ",
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
           การแบ่งหน้า
           ================================================= */

        pageBreak: "auto",

        rowPageBreak:
          "avoid",

        showHead:
          "everyPage",

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

           รวม = 270 mm
           ================================================= */

        columnStyles: {
          /* ลำดับ */

          0: {
            cellWidth: 10,
            halign: "center",
            valign: "middle",
          },

          /* รหัส GFMIS */

          1: {
            cellWidth: 34,
            halign: "center",
            valign: "middle",
          },

          /* รหัสครุภัณฑ์ */

          2: {
            cellWidth: 42,
            halign: "center",
            valign: "middle",
          },

          /* =================================================
             รายการครุภัณฑ์
             ข้อมูลชิดซ้าย
             ================================================= */

          3: {
            cellWidth: 75,
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

          4: {
            cellWidth: 14,
            halign: "center",
            valign: "middle",
          },

          /* หน่วย */

          5: {
            cellWidth: 17,
            halign: "center",
            valign: "middle",
          },

          /* =================================================
             ผู้รับผิดชอบ

             กึ่งกลางแนวนอน
             กึ่งกลางแนวตั้ง
             รองรับหลายบรรทัด
             ================================================= */

          6: {
            cellWidth: 58,
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

          7: {
            cellWidth: 20,
            halign: "center",
            valign: "middle",
          },
        },

        /* =================================================
           บังคับตำแหน่งข้อความ
           ================================================= */

        didParseCell: (
          data
        ) => {
          /* =============================================
             หัว "รายการครุภัณฑ์"
             อยู่กึ่งกลาง
             ============================================= */

          if (
            data.section ===
              "head" &&
            data.column.index === 3
          ) {
            data.cell.styles.halign =
              "center";

            data.cell.styles.valign =
              "middle";
          }

          /* =============================================
             หัว "ผู้รับผิดชอบ"
             อยู่กึ่งกลาง
             ============================================= */

          if (
            data.section ===
              "head" &&
            data.column.index === 6
          ) {
            data.cell.styles.halign =
              "center";

            data.cell.styles.valign =
              "middle";
          }

          /* =============================================
             ข้อมูล "ผู้รับผิดชอบ"
             อยู่กึ่งกลางทุกแถว
             ============================================= */

          if (
            data.section ===
              "body" &&
            data.column.index === 6
          ) {
            data.cell.styles.halign =
              "center";

            data.cell.styles.valign =
              "middle";
          }
        },

        /* =================================================
           วาดหัวเอกสารทุกหน้าที่ autoTable สร้างขึ้น

           ทำให้กรณีตารางเต็มก่อนจำนวนแถวที่เคยกำหนด
           หน้าถัดไปยังมีหัวเอกสารเหมือนกันทุกหน้า
           ================================================= */

        didDrawPage: () => {
          drawPageHeader();
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