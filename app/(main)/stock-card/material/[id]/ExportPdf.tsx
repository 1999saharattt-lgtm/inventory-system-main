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
       เปิดแท็บใหม่ก่อนสร้าง PDF

       สำคัญ:
       ต้องเปิดจากการกดปุ่มโดยตรง
       เพื่อป้องกัน Browser Block Pop-up
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

    /* =====================================================
       หน้ารอระหว่างสร้าง PDF
       ===================================================== */

    previewWindow.document.open();

    previewWindow.document.write(`
      <!DOCTYPE html>
      <html lang="th">
        <head>
          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />

          <title>กำลังสร้าง PDF...</title>

          <style>
            * {
              box-sizing: border-box;
            }

            html,
            body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
            }

            body {
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f8fafc;
              font-family:
                Arial,
                sans-serif;
              color: #0f172a;
            }

            .card {
              width: min(
                90%,
                420px
              );
              padding: 32px;
              border: 1px solid #cbd5e1;
              border-radius: 20px;
              background: #ffffff;
              text-align: center;
              box-shadow:
                0 20px 40px
                rgba(
                  15,
                  23,
                  42,
                  0.12
                );
            }

            .icon {
              margin-bottom: 14px;
              font-size: 42px;
            }

            h2 {
              margin: 0;
              font-size: 22px;
              font-weight: 800;
            }

            p {
              margin: 10px 0 0;
              color: #64748b;
              font-size: 15px;
            }
          </style>
        </head>

        <body>
          <div class="card">
            <div class="icon">
              📄
            </div>

            <h2>
              กำลังสร้าง PDF
            </h2>

            <p>
              กรุณารอสักครู่...
            </p>
          </div>
        </body>
      </html>
    `);

    previewWindow.document.close();

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

      const pageSize = 10;

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

      pages.forEach(
        (
          pageRows,
          pageIndex
        ) => {
          if (
            pageIndex > 0
          ) {
            doc.addPage();
          }

          /* ===============================================
             HEADER
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

          /* ผู้จำหน่ายล่าสุด */

          doc.text(
            `ผู้จำหน่าย : ${
              material.vendor
                ?.name ??
              "-"
            }`,
            leftX,
            54
          );

          /* ราคาล่าสุด */

          doc.text(
            `ราคาล่าสุด : ${formatMoney(
              material.latestPrice
            )} บาท`,
            rightX,
            54
          );

          /* ===============================================
             TABLE DATA
             =============================================== */

          const body =
            pageRows.map(
              (r: any) => {
                return [
                  // วันที่
                  formatThaiDate(
                    r.date
                  ),

                  // เลขที่เอกสาร
                  r.documentNo ||
                    "-",

                  // ผู้จำหน่าย / หน่วยงาน
                  r.owner || "-",

                  // ราคาของรายการนั้น
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
                  r.balance === 0 ||
                  r.balance ===
                    null ||
                  r.balance ===
                    undefined ||
                  r.balance === ""
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
                ];
              }
            );

          /* ===============================================
             เติมแถวเปล่าให้ครบ 10 แถว
             =============================================== */

          while (
            body.length < 10
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

              cellPadding:
                2.5,

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
            },

            columnStyles: {
              // วันที่
              0: {
                cellWidth: 23,
              },

              // เลขที่เอกสาร
              1: {
                cellWidth: 29,
              },

              // ผู้จำหน่าย / หน่วยงาน
              2: {
                cellWidth: 68,
                halign:
                  "left",
              },

              // ราคาล่าสุด
              3: {
                cellWidth: 27,
                halign:
                  "right",
              },

              // รับเข้า
              4: {
                cellWidth: 17,
              },

              // เบิกจ่าย
              5: {
                cellWidth: 17,
              },

              // คงเหลือ
              6: {
                cellWidth: 17,
              },

              // วันผลิต
              7: {
                cellWidth: 25,
              },

              // วันหมดอายุ
              8: {
                cellWidth: 25,
              },
            },
          });
        }
      );

      /* ===================================================
         FILE NAME
         =================================================== */

      const fileName =
        `${
          material.code ||
          "stock-card"
        }-stock-card.pdf`;

      /* ===================================================
         PDF PREVIEW

         เดิม:
         doc.save(fileName)

         ใหม่:
         PDF Blob
         → Blob URL
         → เปิดในแท็บใหม่
         =================================================== */

      const pdfBlob =
        doc.output("blob");

      const pdfUrl =
        URL.createObjectURL(
          pdfBlob
        );

      /*
       * ตั้งชื่อแท็บก่อนเข้า PDF Viewer
       */

      try {
        previewWindow.document.title =
          fileName;
      } catch {
        // ไม่ต้องทำอะไร
      }

      /*
       * เปิด PDF ใน Browser PDF Viewer
       */

      previewWindow.location.replace(
        pdfUrl
      );

      /*
       * ไม่ revoke URL ทันที
       * เพราะ PDF Viewer ยังต้องใช้ URL
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
      onClick={exportPdf}
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