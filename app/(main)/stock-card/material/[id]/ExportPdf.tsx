"use client";

import "@/lib/fonts/THSarabunNew-normal";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Props = {
  material: any;
  rows: any[];
};

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function formatThaiDate(date: any) {
  if (!date) {
    return "-";
  }

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return `${d.getDate()} ${
    thaiMonths[d.getMonth()]
  } ${d.getFullYear() + 543}`;
}

function formatMoney(
  value: number | null | undefined
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  return Number(value).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

/* =========================================================
   TABLE ROW
   ========================================================= */

function createTableRow(r: any) {
  return [
    formatThaiDate(r.date),

    r.documentNo || "-",

    r.owner || "-",

    formatMoney(r.unitPrice),

    r.receiveQty === 0 ||
    r.receiveQty === null ||
    r.receiveQty === undefined ||
    r.receiveQty === ""
      ? "-"
      : String(r.receiveQty),

    r.issueQty === 0 ||
    r.issueQty === null ||
    r.issueQty === undefined ||
    r.issueQty === ""
      ? "-"
      : String(r.issueQty),

    r.balance === null ||
    r.balance === undefined ||
    r.balance === ""
      ? "-"
      : String(r.balance),

    formatThaiDate(
      r.manufacture
    ),

    formatThaiDate(
      r.expiry
    ),
  ];
}

export default function ExportPdf({
  material,
  rows,
}: Props) {
  async function exportPdf() {
    /* =====================================================
       เปิด PDF Preview ก่อน
       ===================================================== */

    const previewWindow =
      window.open(
        "",
        "_blank"
      );

    if (!previewWindow) {
      alert(
        "ไม่สามารถเปิดหน้าต่าง PDF ได้ กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้"
      );
      return;
    }

    try {
      /* ===================================================
         PDF
         =================================================== */

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

      const center =
        pageWidth / 2;

      /* ===================================================
         แนวข้อมูลด้านบน
         =================================================== */

      const leftX = 14;
      const rightX = 150;

      /* ===================================================
         TABLE AREA

         ขอบซ้ายตาราง = 14 mm
         ขอบขวาตาราง = 14 mm

         A4 Landscape ≈ 297 mm

         ความกว้างตารางประมาณ:
         297 - 14 - 14 = 269 mm
         =================================================== */

      const tableLeftX = 14;

      const tableRightMargin = 14;

      const maximumTableWidth =
        pageWidth -
        tableLeftX -
        tableRightMargin;

      /* ===================================================
         จำนวนรายการต่อหน้า
         =================================================== */

      const pageSize = 10;

      /* ===================================================
         HEADER TABLE
         =================================================== */

      const tableHeaders = [
        "วันที่",
        "เลขที่เอกสาร",
        "ผู้จำหน่าย / หน่วยงาน",
        "ราคาล่าสุด",
        "รับเข้า",
        "เบิกจ่าย",
        "คงเหลือ",
        "วันผลิต",
        "วันหมดอายุ",
      ];

      /* ===================================================
         ข้อมูลทั้งหมด
         =================================================== */

      const allTableRows =
        rows.map(
          createTableRow
        );

      /* ===================================================
         ขนาดขั้นต่ำของแต่ละคอลัมน์

         ใช้เป็นจุดเริ่มต้นเท่านั้น
         =================================================== */

      const minimumColumnWidths = [
        20,
        24,
        35,
        22,
        14,
        14,
        14,
        20,
        20,
      ];

      /* ===================================================
         Padding

         ลดเล็กน้อยเพื่อให้ข้อความมีพื้นที่มากขึ้น
         =================================================== */

      const tableCellPadding = 1.1;

      /* ===================================================
         คำนวณความกว้างข้อความจริง
         =================================================== */

      function calculateColumnWidths(
        fontSize: number
      ) {
        doc.setFont(
          "2.3.2 THSarabunNew",
          "normal"
        );

        doc.setFontSize(
          fontSize
        );

        return tableHeaders.map(
          (
            header,
            columnIndex
          ) => {
            let longestTextWidth =
              doc.getTextWidth(
                header
              );

            for (
              const row of
              allTableRows
            ) {
              const value =
                String(
                  row[
                    columnIndex
                  ] ?? ""
                );

              const width =
                doc.getTextWidth(
                  value
                );

              if (
                width >
                longestTextWidth
              ) {
                longestTextWidth =
                  width;
              }
            }

            /*
             * เพิ่มพื้นที่ซ้ายขวา
             * เพื่อไม่ให้ตัวอักษรชนเส้นกรอบ
             */

            const requiredWidth =
              longestTextWidth +
              tableCellPadding * 2 +
              1;

            return Math.max(
              minimumColumnWidths[
                columnIndex
              ],
              requiredWidth
            );
          }
        );
      }

      /* ===================================================
         FONT SIZE

         เริ่มจาก 16 ตามต้นฉบับ

         ถ้าตารางกว้างเกิน:
         ลดตัวอักษรทั้งตารางพร้อมกัน

         ไม่ลดเฉพาะบางช่อง
         =================================================== */

      let tableFontSize = 16;

      let columnWidths =
        calculateColumnWidths(
          tableFontSize
        );

      let calculatedTableWidth =
        columnWidths.reduce(
          (sum, width) =>
            sum + width,
          0
        );

      /*
       * ลดทีละ 0.5
       *
       * ใช้ขนาดเดียวกันทั้ง:
       * - Header
       * - Body
       */

      while (
        calculatedTableWidth >
          maximumTableWidth &&
        tableFontSize > 5
      ) {
        tableFontSize -= 0.5;

        columnWidths =
          calculateColumnWidths(
            tableFontSize
          );

        calculatedTableWidth =
          columnWidths.reduce(
            (sum, width) =>
              sum + width,
            0
          );
      }

      /* ===================================================
         ถ้ายังเกินหลังลดถึง 5

         ลดต่อแบบละเอียด
         เพื่อพยายามรักษาข้อความให้อยู่บรรทัดเดียว
         =================================================== */

      while (
        calculatedTableWidth >
          maximumTableWidth &&
        tableFontSize > 4
      ) {
        tableFontSize -= 0.25;

        columnWidths =
          calculateColumnWidths(
            tableFontSize
          );

        calculatedTableWidth =
          columnWidths.reduce(
            (sum, width) =>
              sum + width,
            0
          );
      }

      /* ===================================================
         ขยายตารางให้เต็มแนวซ้าย-ขวาเสมอ

         กรณีตารางที่คำนวณได้แคบกว่า 269 mm:
         → ขยายทุกคอลัมน์ตามสัดส่วน

         ทำให้กรอบซ้ายและขวายาวเต็มพื้นที่
         =================================================== */

      if (
        calculatedTableWidth <
          maximumTableWidth &&
        calculatedTableWidth > 0
      ) {
        const expandScale =
          maximumTableWidth /
          calculatedTableWidth;

        columnWidths =
          columnWidths.map(
            (width) =>
              width *
              expandScale
          );

        calculatedTableWidth =
          maximumTableWidth;
      }

      /* ===================================================
         กรณียังเกินพื้นที่จริง

         ปรับความกว้างลงตามสัดส่วน
         หลังจากลด Font แล้ว
         =================================================== */

      if (
        calculatedTableWidth >
        maximumTableWidth
      ) {
        const shrinkScale =
          maximumTableWidth /
          calculatedTableWidth;

        columnWidths =
          columnWidths.map(
            (width) =>
              width *
              shrinkScale
          );

        calculatedTableWidth =
          maximumTableWidth;
      }

      /* ===================================================
         แบ่งหน้า
         =================================================== */

      const pages: any[][] = [];

      for (
        let i = 0;
        i < rows.length;
        i += pageSize
      ) {
        pages.push(
          rows.slice(
            i,
            i + pageSize
          )
        );
      }

      if (
        pages.length === 0
      ) {
        pages.push([]);
      }

      /* ===================================================
         HEADER ทุกหน้า
         =================================================== */

      function drawPageHeader() {
        doc.setFont(
          "2.3.2 THSarabunNew",
          "normal"
        );

        /* ===============================================
           ชื่อเอกสาร
           =============================================== */

        doc.setFontSize(26);

        doc.text(
          "บัญชีพัสดุ",
          center,
          16,
          {
            align: "center",
          }
        );

        /* ===============================================
           ส่วนราชการ
           =============================================== */

        doc.setFontSize(16);

        doc.text(
          "ส่วนราชการ  กระทรวงสาธารณสุข  กรมอนามัย",
          232,
          18,
          {
            align: "center",
          }
        );

        doc.text(
          "หน่วยงาน  สำนักอนามัยการเจริญพันธุ์",
          232,
          24,
          {
            align: "center",
          }
        );

        /* ===============================================
           รายละเอียดพัสดุ
           =============================================== */

        doc.text(
          `รหัสพัสดุ : ${
            material.code ||
            "-"
          }`,
          leftX,
          38
        );

        doc.text(
          `รายการพัสดุ : ${
            material.name ||
            "-"
          }`,
          rightX,
          38
        );

        doc.text(
          `หมวดหมู่ : ${
            categoryName[
              material.category
            ] ??
            material.category ??
            "-"
          }`,
          leftX,
          46
        );

        doc.text(
          `หน่วย : ${
            material.unit ||
            "-"
          }`,
          rightX,
          46
        );

        doc.text(
          `ผู้จำหน่าย : ${
            material.vendor
              ?.name ??
            "-"
          }`,
          leftX,
          54
        );

        doc.text(
          `ราคาล่าสุด : ${formatMoney(
            material.latestPrice
          )} บาท`,
          rightX,
          54
        );
      }

      /* ===================================================
         COLUMN STYLE

         ความกว้างมาจากข้อความจริง
         =================================================== */

      const columnStyles: Record<
        number,
        any
      > = {
        0: {
          cellWidth:
            columnWidths[0],
          halign:
            "center",
        },

        1: {
          cellWidth:
            columnWidths[1],
          halign:
            "center",
        },

        2: {
          cellWidth:
            columnWidths[2],
          halign:
            "left",
        },

        3: {
          cellWidth:
            columnWidths[3],
          halign:
            "right",
        },

        4: {
          cellWidth:
            columnWidths[4],
          halign:
            "center",
        },

        5: {
          cellWidth:
            columnWidths[5],
          halign:
            "center",
        },

        6: {
          cellWidth:
            columnWidths[6],
          halign:
            "center",
        },

        7: {
          cellWidth:
            columnWidths[7],
          halign:
            "center",
        },

        8: {
          cellWidth:
            columnWidths[8],
          halign:
            "center",
        },
      };

      /* ===================================================
         สร้างแต่ละหน้า
         =================================================== */

      pages.forEach(
        (
          pageRows,
          pageIndex
        ) => {
          /* ===============================================
             PAGE ใหม่
             =============================================== */

          if (
            pageIndex > 0
          ) {
            doc.addPage(
              "a4",
              "landscape"
            );
          }

          /* ===============================================
             หัวกระดาษเหมือนกันทุกหน้า
             =============================================== */

          drawPageHeader();

          /* ===============================================
             ตาราง
             =============================================== */

          const body =
            pageRows.map(
              createTableRow
            );

          /*
           * เติมแถวว่างให้ครบ 10
           */

          while (
            body.length <
            pageSize
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

          autoTable(doc, {
            startY: 60,

            /*
             * ตารางใช้ความกว้างเต็ม
             * จาก x=14 ไปจนถึงขอบขวา 14 mm
             */

            tableWidth:
              maximumTableWidth,

            margin: {
              left:
                tableLeftX,

              right:
                tableRightMargin,
            },

            head: [
              tableHeaders,
            ],

            body,

            theme: "grid",

            /* =============================================
               BODY + GLOBAL TABLE STYLE
               ============================================= */

            styles: {
              font:
                "2.3.2 THSarabunNew",

              fontStyle:
                "normal",

              /*
               * ขนาดเดียวกันทั้งตาราง
               */

              fontSize:
                tableFontSize,

              /*
               * ลด Padding
               */

              cellPadding:
                tableCellPadding,

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
                8,

              /*
               * สำคัญ:
               *
               * ห้าม:
               * - ellipsize
               * - ...
               * - linebreak
               *
               * ให้แสดงข้อความเต็ม
               */

              overflow:
                "visible",
            },

            /* =============================================
               HEADER TABLE
               ============================================= */

            headStyles: {
              font:
                "2.3.2 THSarabunNew",

              fontStyle:
                "normal",

              /*
               * ใช้ Font Size เดียวกับ Body
               */

              fontSize:
                tableFontSize,

              fillColor: [
                255,
                255,
                255,
              ],

              textColor: 0,

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
                tableCellPadding,

              overflow:
                "visible",
            },

            columnStyles,

            /*
             * ไม่ให้แถวเดียวถูกแยกข้ามหน้า
             */

            rowPageBreak:
              "avoid",
          });
        }
      );

      /* ===================================================
         PDF PREVIEW

         ไม่ Download ทันที
         =================================================== */

      const pdfBlob =
        doc.output("blob");

      const pdfUrl =
        URL.createObjectURL(
          pdfBlob
        );

      previewWindow.location.replace(
        pdfUrl
      );

      /*
       * Browser PDF Viewer
       * ยังต้องใช้ Blob URL
       */

      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            pdfUrl
          );
        },
        5 * 60 * 1000
      );
    } catch (error) {
      console.error(
        "ไม่สามารถสร้าง PDF ได้:",
        error
      );

      if (
        previewWindow &&
        !previewWindow.closed
      ) {
        previewWindow.close();
      }

      alert(
        "ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง"
      );
    }
  }

  return (
    <button
      type="button"
      onClick={
        exportPdf
      }
      className="
        rounded-xl
        bg-red-600
        px-5
        py-2
        font-bold
        text-white
        shadow
        transition
        hover:bg-red-700
      "
    >
      ส่งออก PDF
    </button>
  );
}