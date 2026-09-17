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
  if (!date) return "-";

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

export default function ExportPdf({
  material,
  rows,
}: Props) {
  async function exportPdf() {
    /* =====================================================
       เปิดแท็บใหม่สำหรับ Preview
       ===================================================== */

    const previewWindow = window.open(
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

      /*
       * จำนวนรายการต่อหน้า
       */
      const pageSize = 10;

      /*
       * ความกว้างคอลัมน์รวม = 249 mm
       *
       * A4 แนวนอน = 297 mm
       *
       * จึงคำนวณ Margin ซ้าย
       * เพื่อให้ตารางอยู่กึ่งกลางหน้ากระดาษ
       */
      const tableWidth = 249;

      const tableLeft =
        (pageWidth - tableWidth) /
        2;

      /* ===================================================
         แบ่งข้อมูลออกเป็นหน้า
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

      if (pages.length === 0) {
        pages.push([]);
      }

      /* ===================================================
         FUNCTION: HEADER

         เรียกใหม่ทุกหน้า
         เพื่อให้ทุกแผ่นมีหัวกระดาษเหมือนกัน
         =================================================== */

      function drawPageHeader() {
        doc.setFont(
          "2.3.2 THSarabunNew",
          "normal"
        );

        doc.setFontSize(26);

        doc.text(
          "บัญชีพัสดุ",
          center,
          16,
          {
            align: "center",
          }
        );

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
            material.vendor?.name ??
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
         CREATE EACH PAGE
         =================================================== */

      pages.forEach(
        (
          pageRows,
          pageIndex
        ) => {
          if (
            pageIndex > 0
          ) {
            doc.addPage(
              "a4",
              "landscape"
            );
          }

          /*
           * หัวกระดาษ
           * ต้องมีทุกหน้า
           */
          drawPageHeader();

          /* ===============================================
             TABLE DATA
             =============================================== */

          const body =
            pageRows.map(
              (r: any) => [
                // วันที่
                formatThaiDate(
                  r.date
                ),

                // เลขที่เอกสาร
                r.documentNo ||
                  "-",

                // ผู้จำหน่าย / หน่วยงาน
                r.owner ||
                  "-",

                // ราคาล่าสุด
                formatMoney(
                  r.unitPrice
                ),

                // รับเข้า
                r.receiveQty ===
                  0 ||
                r.receiveQty ===
                  null ||
                r.receiveQty ===
                  undefined ||
                r.receiveQty ===
                  ""
                  ? "-"
                  : r.receiveQty,

                // เบิกจ่าย
                r.issueQty ===
                  0 ||
                r.issueQty ===
                  null ||
                r.issueQty ===
                  undefined ||
                r.issueQty ===
                  ""
                  ? "-"
                  : r.issueQty,

                // คงเหลือ
                r.balance ===
                  null ||
                r.balance ===
                  undefined ||
                r.balance ===
                  ""
                  ? "-"
                  : r.balance,

                // วันผลิต
                formatThaiDate(
                  r.manufacture
                ),

                // วันหมดอายุ
                formatThaiDate(
                  r.expiry
                ),
              ]
            );

          /*
           * เติมแถวเปล่า
           * ให้ครบ 10 แถวทุกหน้า
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

          /* ===============================================
             TABLE
             =============================================== */

          autoTable(doc, {
            startY: 60,

            /*
             * กำหนดความกว้างตาราง
             */
            tableWidth,

            /*
             * จัดตารางอยู่กึ่งกลางหน้า
             */
            margin: {
              left:
                tableLeft,
              right:
                tableLeft,
            },

            head: [
              [
                "วันที่",
                "เลขที่เอกสาร",
                "ผู้จำหน่าย / หน่วยงาน",
                "ราคาล่าสุด",
                "รับเข้า",
                "เบิกจ่าย",
                "คงเหลือ",
                "วันผลิต",
                "วันหมดอายุ",
              ],
            ],

            body,

            theme: "grid",

            styles: {
              font:
                "2.3.2 THSarabunNew",

              fontStyle:
                "normal",

              fontSize: 16,

              cellPadding: 2,

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
               * ไม่ให้ข้อความแตกเป็นหลายบรรทัด
               *
               * หากยาวเกินพื้นที่
               * จะตัดด้วย ...
               */
              overflow:
                "ellipsize",
            },

            headStyles: {
              font:
                "2.3.2 THSarabunNew",

              fontStyle:
                "normal",

              fontSize: 16,

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

              /*
               * หัวตาราง
               * ไม่ตกบรรทัดเช่นกัน
               */
              overflow:
                "ellipsize",
            },

            columnStyles: {
              /*
               * วันที่
               * เพิ่มพื้นที่จาก 23 → 28
               */
              0: {
                cellWidth: 28,
                halign:
                  "center",
              },

              /*
               * เลขที่เอกสาร
               */
              1: {
                cellWidth: 29,
                halign:
                  "center",
              },

              /*
               * ผู้จำหน่าย / หน่วยงาน
               */
              2: {
                cellWidth: 58,
                halign:
                  "left",
              },

              /*
               * ราคาล่าสุด
               */
              3: {
                cellWidth: 27,
                halign:
                  "right",
              },

              /*
               * รับเข้า
               */
              4: {
                cellWidth: 17,
                halign:
                  "center",
              },

              /*
               * เบิกจ่าย
               */
              5: {
                cellWidth: 17,
                halign:
                  "center",
              },

              /*
               * คงเหลือ
               */
              6: {
                cellWidth: 17,
                halign:
                  "center",
              },

              /*
               * วันผลิต
               */
              7: {
                cellWidth: 28,
                halign:
                  "center",
              },

              /*
               * วันหมดอายุ
               */
              8: {
                cellWidth: 28,
                halign:
                  "center",
              },
            },
          });
        }
      );

      /* ===================================================
         PDF PREVIEW
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
       * ให้ PDF Viewer มีเวลาอ่าน Blob
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