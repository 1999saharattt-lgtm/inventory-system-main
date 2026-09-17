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
   สร้างข้อมูล 1 แถวของตาราง

   ใช้ Function เดียวกันทั้ง:
   - คำนวณความกว้าง
   - สร้าง PDF

   เพื่อให้ความกว้างคอลัมน์ตรงกับข้อมูลจริง
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
       เปิดหน้าต่าง Preview ก่อน

       ต้องทำทันทีตอนผู้ใช้กดปุ่ม
       เพื่อป้องกัน Popup Block
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
         CREATE PDF
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

      const leftX = 14;
      const rightX = 150;

      /* ===================================================
         จำนวนรายการต่อหน้า
         =================================================== */

      const pageSize = 10;

      /* ===================================================
         หัวตาราง
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

         ใช้สำหรับหาข้อความที่ยาวที่สุดของแต่ละคอลัมน์
         ก่อนแบ่งหน้า
         =================================================== */

      const allTableRows =
        rows.map(
          createTableRow
        );

      /* ===================================================
         TABLE MARGIN

         ให้สามารถขยายตารางออกไปใกล้ขอบกระดาษได้

         A4 Landscape ≈ 297 mm

         ซ้าย 2 mm
         ขวา 2 mm

         พื้นที่ตารางประมาณ 293 mm
         =================================================== */

      const minimumPageMargin = 2;

      const maximumTableWidth =
        pageWidth -
        minimumPageMargin * 2;

      /* ===================================================
         MINIMUM COLUMN WIDTH

         เป็นค่าขั้นต่ำเท่านั้น

         หากข้อความยาวกว่า
         ระบบจะขยายคอลัมน์ให้อัตโนมัติ
         =================================================== */

      const minimumColumnWidths = [
        21, // วันที่
        24, // เลขที่เอกสาร
        35, // ผู้จำหน่าย / หน่วยงาน
        22, // ราคาล่าสุด
        14, // รับเข้า
        14, // เบิกจ่าย
        14, // คงเหลือ
        21, // วันผลิต
        21, // วันหมดอายุ
      ];

      /* ===================================================
         CELL PADDING
         =================================================== */

      const tableCellPadding = 1.5;

      /* ===================================================
         คำนวณความกว้างจริงของแต่ละคอลัมน์

         หลักการ:
         1. วัด Header
         2. วัดข้อมูลทุกแถว
         3. เอาค่าที่ยาวที่สุด
         4. บวก Padding
         5. ห้ามต่ำกว่า Minimum Width
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
            let maximumTextWidth =
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

              const textWidth =
                doc.getTextWidth(
                  value
                );

              if (
                textWidth >
                maximumTextWidth
              ) {
                maximumTextWidth =
                  textWidth;
              }
            }

            /*
             * เผื่อพื้นที่ข้างข้อความเล็กน้อย
             * ป้องกันตัวอักษรชนเส้นตาราง
             */

            const requiredWidth =
              maximumTextWidth +
              tableCellPadding *
                2 +
              1.5;

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
         GLOBAL TABLE FONT SIZE

         เริ่มจาก 16 เหมือน PDF เดิม

         หากข้อความทั้งหมดไม่สามารถอยู่บรรทัดเดียว
         ภายในหน้ากระดาษได้

         → ลดขนาดตัวอักษรทั้งหมดพร้อมกัน

         ไม่มีการลดเฉพาะบางช่อง
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
       * ลด Font ทีละ 0.5
       *
       * จนกว่าข้อความทั้งหมดจะพอดี
       *
       * ต่ำสุด 6
       */

      while (
        calculatedTableWidth >
          maximumTableWidth &&
        tableFontSize > 6
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
         หากตารางยังเกินหน้าแม้ลดถึง 6

         ให้ใช้ความกว้างเต็มพื้นที่กระดาษ
         และกระจายพื้นที่ตามสัดส่วน

         แต่จะไม่ใช้ ellipsize
         ไม่ใส่ ...
         ไม่ตัดข้อความ
         =================================================== */

      if (
        calculatedTableWidth >
        maximumTableWidth
      ) {
        const scale =
          maximumTableWidth /
          calculatedTableWidth;

        columnWidths =
          columnWidths.map(
            (width) =>
              width * scale
          );

        calculatedTableWidth =
          columnWidths.reduce(
            (sum, width) =>
              sum + width,
            0
          );
      }

      /* ===================================================
         ตารางต้องอยู่กึ่งกลางหน้ากระดาษ
         =================================================== */

      const tableLeftMargin =
        Math.max(
          minimumPageMargin,
          (
            pageWidth -
            calculatedTableWidth
          ) / 2
        );

      /* ===================================================
         PAGE DATA
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
         HEADER FUNCTION

         เรียกทุกหน้า
         ดังนั้นทุกแผ่นจะมีหัวกระดาษเหมือนกัน
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
           ส่วนราชการ / หน่วยงาน
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
         สร้างแต่ละหน้า
         =================================================== */

      pages.forEach(
        (
          pageRows,
          pageIndex
        ) => {
          /* ===============================================
             PAGE BREAK
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
             หัวกระดาษทุกหน้า
             =============================================== */

          drawPageHeader();

          /* ===============================================
             BODY DATA
             =============================================== */

          const body =
            pageRows.map(
              createTableRow
            );

          /* ===============================================
             เติมแถวว่างให้ครบ 10 แถว
             =============================================== */

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

          /* ===============================================
             COLUMN STYLE

             ใช้ความกว้างที่คำนวณจากข้อความจริง
             =============================================== */

          const columnStyles: Record<
            number,
            {
              cellWidth: number;
              halign:
                | "left"
                | "center"
                | "right";
            }
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

          /* ===============================================
             TABLE
             =============================================== */

          autoTable(doc, {
            startY: 60,

            /*
             * ความกว้างตามข้อความจริง
             */
            tableWidth:
              calculatedTableWidth,

            /*
             * จัดกึ่งกลาง
             */
            margin: {
              left:
                tableLeftMargin,

              right:
                tableLeftMargin,
            },

            head: [
              tableHeaders,
            ],

            body,

            theme: "grid",

            styles: {
              font:
                "2.3.2 THSarabunNew",

              fontStyle:
                "normal",

              /*
               * ขนาดเท่ากันทั้งตาราง
               */
              fontSize:
                tableFontSize,

              /*
               * ลด Padding เล็กน้อย
               * เพื่อให้มีพื้นที่ข้อความมากขึ้น
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
               * สำคัญ
               *
               * ไม่ใช้:
               * ellipsize
               * linebreak
               * hidden
               *
               * ข้อความจึงไม่ถูกใส่ ...
               * และไม่ถูกตัด
               */
              overflow:
                "visible",
            },

            headStyles: {
              font:
                "2.3.2 THSarabunNew",

              fontStyle:
                "normal",

              /*
               * หัวตารางใช้ขนาดเดียวกับข้อมูล
               * เพื่อให้ทุกคอลัมน์พอดี
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
          });
        }
      );

      /* ===================================================
         PREVIEW PDF
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
       * PDF Viewer ต้องใช้ URL ต่อ
       * จึงไม่ revoke ทันที
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