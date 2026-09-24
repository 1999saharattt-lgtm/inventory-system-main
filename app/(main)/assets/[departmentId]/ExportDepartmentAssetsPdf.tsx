"use client";

import "@/lib/fonts/THSarabunNew-normal";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type Asset = {
  id: number;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  governmentAssetNo: string | null;
  officeAssetNo: string | null;

  departmentName?: string | null;
  sectionName?: string | null;
  officerName?: string | null;

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

  purchaseDate?: string | Date | null;
  price?: number | null;
  location?: string | null;
  remark?: string | null;

  quantity?: number | null;
  unit?: string | null;
};

type Props = {
  departmentName: string;
  assets: Asset[];

  /*
   * รองรับ props เดิมจากหน้า
   * /assets/[departmentId]/all
   */
  departmentId?: number;

  department?: {
    id: number;
    name: string;
  };
};

/* =========================================================
   CATEGORY NAME

   เก็บไว้รองรับข้อมูลเดิม
========================================================= */

const categoryName: Record<
  string,
  string
> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",

  AIR_CONDITIONER:
    "เครื่องปรับอากาศ",

  TELEPHONE:
    "เครื่องโทรศัพท์",

  CABINET:
    "ตู้และชั้นวาง",

  SHELF:
    "ตู้และชั้นวาง",

  COMPUTER:
    "คอมพิวเตอร์",

  MONITOR:
    "คอมพิวเตอร์",

  PRINTER:
    "เครื่องพิมพ์",

  OTHER:
    "ทั่วไป",

  NO_SYSTEM:
    "ไม่มีอยู่ในระบบ",
};

/* =========================================================
   CATEGORY UNIT

   ใช้เมื่อข้อมูลไม่มี unit
========================================================= */

const categoryUnit: Record<
  string,
  string
> = {
  DESK: "ตัว",
  CHAIR: "ตัว",

  AIR_CONDITIONER:
    "เครื่อง",

  TELEPHONE:
    "เครื่อง",

  CABINET:
    "ตัว",

  SHELF:
    "ตัว",

  COMPUTER:
    "เครื่อง",

  MONITOR:
    "เครื่อง",

  PRINTER:
    "เครื่อง",

  OTHER:
    "รายการ",

  NO_SYSTEM:
    "รายการ",
};

/* =========================================================
   STATUS
========================================================= */

const statusName: Record<
  string,
  string
> = {
  IN_USE:
    "ยังใช้งาน",

  ACTIVE:
    "ยังใช้งาน",

  INACTIVE:
    "ไม่ใช้งาน",

  DAMAGED:
    "ชำรุด",

  WAITING_DISPOSAL:
    "รอจำหน่าย",

  DISPOSED:
    "จำหน่ายแล้ว",

  LOST:
    "สูญหาย",
};

/* =========================================================
   FISCAL YEAR

   ปีงบประมาณราชการ
   ต.ค. - ก.ย.
========================================================= */

function getFiscalYear(
  date: Date
) {
  const month =
    date.getMonth() + 1;

  const year =
    date.getFullYear();

  if (month >= 10) {
    return year + 1 + 543;
  }

  return year + 543;
}

/* =========================================================
   CURRENT QUARTER

   ต.ค. - ธ.ค. = 1
   ม.ค. - มี.ค. = 2
   เม.ย. - มิ.ย. = 3
   ก.ค. - ก.ย. = 4
========================================================= */

function getCurrentQuarter(
  date: Date
) {
  const month =
    date.getMonth() + 1;

  if (
    month >= 10 &&
    month <= 12
  ) {
    return 1;
  }

  if (
    month >= 1 &&
    month <= 3
  ) {
    return 2;
  }

  if (
    month >= 4 &&
    month <= 6
  ) {
    return 3;
  }

  return 4;
}

/* =========================================================
   RESPONSIBLE NAME
========================================================= */

function getResponsibleName(
  asset: Asset
) {
  /* =======================================================
     DEPARTMENT
  ======================================================= */

  const assetDepartmentName =
    asset.departmentName?.trim() ||
    asset.department?.name?.trim() ||
    "";

  /* =======================================================
     RESPONSIBLE NAME
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
     * ถ้ามีชื่อหน่วยงานอยู่แล้ว
     * ไม่เติมซ้ำ
     */

    if (
      assetDepartmentName &&
      (
        originalResponsibleName ===
          assetDepartmentName ||
        originalResponsibleName.startsWith(
          `${assetDepartmentName} /`
        )
      )
    ) {
      return originalResponsibleName;
    }

    if (
      assetDepartmentName
    ) {
      return `${assetDepartmentName} / ${originalResponsibleName}`;
    }

    return originalResponsibleName;
  }

  /* =======================================================
     SECTION FALLBACK
  ======================================================= */

  const sectionName =
    asset.sectionName?.trim() ||
    asset.section?.name?.trim() ||
    "";

  if (sectionName) {
    if (
      assetDepartmentName
    ) {
      return `${assetDepartmentName} / ${sectionName}`;
    }

    return sectionName;
  }

  /* =======================================================
     OFFICER FALLBACK
  ======================================================= */

  const officerName =
    asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
      : "";

  if (officerName) {
    if (
      assetDepartmentName
    ) {
      return `${assetDepartmentName} / ${officerName}`;
    }

    return officerName;
  }

  if (
    assetDepartmentName
  ) {
    return assetDepartmentName;
  }

  return "-";
}

/* =========================================================
   ASSET UNIT
========================================================= */

function getAssetUnit(
  asset: Asset
) {
  const originalUnit =
    asset.unit?.trim();

  if (
    originalUnit &&
    originalUnit !== "-"
  ) {
    return originalUnit;
  }

  return (
    categoryUnit[
      asset.category
    ] ?? "รายการ"
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ExportDepartmentAssetsPdf({
  departmentName,
  assets,
}: Props) {
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

  /* =======================================================
     PAGE

     A4 แนวนอน = 297 x 210 mm
  ======================================================= */

  const pageWidth = 297;

  /* =======================================================
     TABLE WIDTH
  ======================================================= */

  const tableWidth = 270;

  /* =======================================================
     CENTER TABLE
  ======================================================= */

  const marginX =
    (pageWidth - tableWidth) / 2;

  /* =======================================================
     EXPORT PDF
  ======================================================= */

  async function handleExportPdf() {
    if (
      assets.length === 0 ||
      isExporting
    ) {
      return;
    }

    try {
      setIsExporting(true);

      /* =====================================================
         DATE
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
         PDF
      ===================================================== */

      const doc =
        new jsPDF({
          orientation:
            "landscape",

          unit:
            "mm",

          format:
            "a4",

          compress:
            true,
        });

      /* =====================================================
         FONT
      ===================================================== */

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      /* =====================================================
         PAGE HEADER
      ===================================================== */

      function drawPageHeader() {
        const center =
          pageWidth / 2;

        doc.setFont(
          "2.3.2 THSarabunNew",
          "normal"
        );

        /* -------------------------------------------------
           TITLE
        ------------------------------------------------- */

        doc.setFontSize(26);

        doc.text(
          "ทะเบียนคุมครุภัณฑ์",
          center,
          15,
          {
            align:
              "center",
          }
        );

        /* -------------------------------------------------
           DEPARTMENT
        ------------------------------------------------- */

        doc.setFontSize(16);

        const departmentHeader =
          `${departmentName} สำนักอนามัยการเจริญพันธุ์`;

        doc.text(
          departmentHeader,
          center,
          23,
          {
            align:
              "center",
          }
        );

        /* -------------------------------------------------
           FISCAL YEAR
        ------------------------------------------------- */

        const fiscalHeader =
          `รอบไตรมาสที่ ${currentQuarter} ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`;

        doc.text(
          fiscalHeader,
          center,
          31,
          {
            align:
              "center",
          }
        );
      }

      /* =====================================================
         TABLE BODY
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

              asset.name ||
                "-",

              /* จำนวน */

              asset.quantity ??
                1,

              /* หน่วย */

              getAssetUnit(
                asset
              ),

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
      ===================================================== */

      autoTable(
        doc,
        {
          /* =================================================
             START
          ================================================= */

          startY: 37,

          /* =================================================
             MARGIN
          ================================================= */

          margin: {
            top: 37,
            left: marginX,
            right: marginX,
            bottom: 10,
          },

          /* =================================================
             TABLE WIDTH
          ================================================= */

          tableWidth,

          /* =================================================
             HEADER
          ================================================= */

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

          theme:
            "grid",

          /* =================================================
             PAGE
          ================================================= */

          pageBreak:
            "auto",

          rowPageBreak:
            "avoid",

          showHead:
            "everyPage",

          /* =================================================
             BASE STYLE
          ================================================= */

          styles: {
            font:
              "2.3.2 THSarabunNew",

            fontStyle:
              "normal",

            fontSize:
              13,

            cellPadding:
              1.2,

            halign:
              "center",

            valign:
              "middle",

            lineColor: [
              0,
              0,
              0,
            ],

            lineWidth:
              0.25,

            minCellHeight:
              7.2,

            overflow:
              "linebreak",

            textColor: [
              0,
              0,
              0,
            ],
          },

          /* =================================================
             HEADER STYLE
          ================================================= */

          headStyles: {
            font:
              "2.3.2 THSarabunNew",

            fontStyle:
              "normal",

            fontSize:
              13,

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

            lineWidth:
              0.25,

            cellPadding:
              1.3,

            minCellHeight:
              9,

            overflow:
              "linebreak",
          },

          /* =================================================
             BODY STYLE
          ================================================= */

          bodyStyles: {
            font:
              "2.3.2 THSarabunNew",

            fontStyle:
              "normal",

            fontSize:
              13,

            textColor: [
              0,
              0,
              0,
            ],

            halign:
              "center",

            valign:
              "middle",

            cellPadding:
              1.2,

            minCellHeight:
              7.2,

            overflow:
              "linebreak",
          },

          /* =================================================
             COLUMN STYLE

             รวม = 270 mm
          ================================================= */

          columnStyles: {
            /* ลำดับ */

            0: {
              cellWidth:
                10,

              halign:
                "center",

              valign:
                "middle",
            },

            /* GFMIS */

            1: {
              cellWidth:
                34,

              halign:
                "center",

              valign:
                "middle",
            },

            /* รหัสครุภัณฑ์ */

            2: {
              cellWidth:
                42,

              halign:
                "center",

              valign:
                "middle",
            },

            /* รายการ */

            3: {
              cellWidth:
                75,

              halign:
                "left",

              valign:
                "middle",

              cellPadding: {
                top:
                  1.2,

                right:
                  1.2,

                bottom:
                  1.2,

                left:
                  2,
              },
            },

            /* จำนวน */

            4: {
              cellWidth:
                14,

              halign:
                "center",

              valign:
                "middle",
            },

            /* หน่วย */

            5: {
              cellWidth:
                17,

              halign:
                "center",

              valign:
                "middle",
            },

            /* ผู้รับผิดชอบ */

            6: {
              cellWidth:
                58,

              halign:
                "center",

              valign:
                "middle",

              cellPadding: {
                top:
                  1.2,

                right:
                  1.2,

                bottom:
                  1.2,

                left:
                  1.2,
              },

              overflow:
                "linebreak",
            },

            /* สถานะ */

            7: {
              cellWidth:
                20,

              halign:
                "center",

              valign:
                "middle",
            },
          },

          /* =================================================
             CELL STYLE
          ================================================= */

          didParseCell: (
            data
          ) => {
            /* ===============================================
               HEADER: รายการครุภัณฑ์
            =============================================== */

            if (
              data.section ===
                "head" &&
              data.column.index ===
                3
            ) {
              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";
            }

            /* ===============================================
               HEADER: ผู้รับผิดชอบ
            =============================================== */

            if (
              data.section ===
                "head" &&
              data.column.index ===
                6
            ) {
              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";
            }

            /* ===============================================
               BODY: ผู้รับผิดชอบ
            =============================================== */

            if (
              data.section ===
                "body" &&
              data.column.index ===
                6
            ) {
              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";
            }
          },

          /* =================================================
             HEADER ทุกหน้า
          ================================================= */

          didDrawPage: () => {
            drawPageHeader();
          },

          /* =================================================
             TABLE BORDER
          ================================================= */

          tableLineColor: [
            0,
            0,
            0,
          ],

          tableLineWidth:
            0.25,
        }
      );

      /* =====================================================
         OPEN PDF
      ===================================================== */

      const pdfBlob =
        doc.output(
          "blob"
        );

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

      /* =====================================================
         FALLBACK
      ===================================================== */

      if (!newWindow) {
        const link =
          document.createElement(
            "a"
          );

        link.href =
          pdfUrl;

        link.target =
          "_blank";

        link.rel =
          "noopener noreferrer";

        link.click();
      }

      /* =====================================================
         CLEAN URL
      ===================================================== */

      setTimeout(
        () => {
          URL.revokeObjectURL(
            pdfUrl
          );
        },
        60000
      );
    } catch (error) {
      console.error(
        "ไม่สามารถสร้าง PDF ได้:",
        error
      );

      alert(
        "ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setIsExporting(
        false
      );
    }
  }

  /* =========================================================
     UI

     ใช้ AppButton ตัวกลางของระบบเท่านั้น
     ไม่เขียน style ปุ่มเอง
  ========================================================= */

  return (
    <AppButton
      type="button"
      variant="danger"
      size="md"
      onClick={
        handleExportPdf
      }
      disabled={
        isExporting ||
        assets.length === 0
      }
      icon={
        <span
          aria-hidden="true"
        >
          {isExporting
            ? "⏳"
            : "📄"}
        </span>
      }
    >
      {isExporting
        ? "กำลังสร้าง PDF..."
        : "ส่งออก PDF"}
    </AppButton>
  );
}